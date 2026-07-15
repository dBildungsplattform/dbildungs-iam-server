import { Injectable } from '@nestjs/common';
import { difference, isEqual, xor } from 'lodash-es';

import { DomainError } from '../../../shared/error/domain.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { IPersonPermissions } from '../../../shared/permissions/person-permissions.interface.js';
import { ServiceProviderID } from '../../../shared/types/aggregate-ids.types.js';
import { Err, Ok } from '../../../shared/util/result.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { RollenerweiterungRepo } from '../../rolle/repo/rollenerweiterung.repo.js';
import { ServiceProviderInternalRepo } from '../repo/service-provider.internal.repo.js';
import { ServiceProviderPropertyPermissions, ServiceProviderRepo } from '../repo/service-provider.repo.js';
import { DuplicateNameError } from '../specification/error/duplicate-name.error.js';
import { NameUniqueAtOrgaSpecification } from '../specification/name-unique-at-orga.specification.js';
import { AttachedRollenError } from './errors/attached-rollen.error.js';
import { AttachedRollenerweiterungenError } from './errors/attached-rollenerweiterungen.error.js';
import { InvalidLogoCombinationError } from './errors/invalid-logo-combination.error.js';
import { VidisServiceProviderImmutableError } from './errors/vidis-service-provider-immutable.error.js';
import { ServiceProviderKategorie, ServiceProviderMerkmal } from './service-provider.enum.js';
import { ServiceProvider, ServiceProviderUpdateParams } from './service-provider.js';

/**
 * Used when person doesn't have full rights to create/update serviceprovider.
 * - Use these values as default, when creating service providers
 * - Use the keys to copy values of existing service provider, when updating
 */
const SP_EINGESCHRAENKT_DEFAULTS: Pick<
    ServiceProvider<true>,
    'merkmale' | 'rollenartenWhitelist' | 'requires2fa' | 'kategorie'
> = {
    merkmale: [
        ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG,
        ServiceProviderMerkmal.NACHTRAEGLICH_ZUWEISBAR,
        ServiceProviderMerkmal.ANBIETEN_IN_SCHULISCHER_ANGEBOTSVERWALTUNG,
        ServiceProviderMerkmal.ANBIETEN_IN_SCHULISCHER_ROLLENVERWALTUNG,
    ],
    rollenartenWhitelist: [],
    requires2fa: false,
    kategorie: ServiceProviderKategorie.SCHULISCH,
};

@Injectable()
export class ServiceProviderModificationService {
    public constructor(
        private readonly serviceProviderRepo: ServiceProviderRepo,
        private readonly serviceProviderInternalRepo: ServiceProviderInternalRepo,
        private readonly rolleRepo: RolleRepo,
        private readonly rollenerweiterungRepo: RollenerweiterungRepo,
    ) {}

    public async create(
        permissions: IPersonPermissions,
        serviceProvider: ServiceProvider<false>,
    ): Promise<Result<ServiceProvider<true>, DomainError>> {
        const permissionsResult: Result<ServiceProviderPropertyPermissions, DomainError> =
            await this.serviceProviderRepo.getPermissionsForServiceProvider(permissions, serviceProvider);

        // Not allowed to modify this serviceprovider
        if (!permissionsResult.ok) {
            return permissionsResult;
        }

        const duplicateNameError: Option<DuplicateNameError> = await this.validateUniqueName(serviceProvider);
        if (duplicateNameError) {
            return Err(duplicateNameError);
        }

        // Assign defaults if person only has partial system rights
        if (permissionsResult.value === ServiceProviderPropertyPermissions.EINGESCHRAENKT) {
            const updateError: Option<InvalidLogoCombinationError> = serviceProvider.update(SP_EINGESCHRAENKT_DEFAULTS);

            if (updateError) {
                return Err(updateError);
            }

            if (serviceProvider.rollenartenWhitelist.length > 0) {
                return Err(new MissingPermissionsError('Insufficient permissions to set rollenartenWhitelist'));
            }
            if (xor(serviceProvider.merkmale, SP_EINGESCHRAENKT_DEFAULTS.merkmale).length > 0) {
                return Err(new MissingPermissionsError('Insufficient permissions to set merkmale'));
            }
        }

        const persistedServiceProvider: ServiceProvider<true> =
            await this.serviceProviderInternalRepo.persistAndFlush(serviceProvider);

        return Ok(persistedServiceProvider);
    }

    public async update(
        permissions: IPersonPermissions,
        serviceProvider: ServiceProvider<true>,
    ): Promise<Result<ServiceProvider<true>, DomainError>> {
        const permissionsResult: Result<ServiceProviderPropertyPermissions, DomainError> =
            await this.serviceProviderRepo.getPermissionsForServiceProvider(permissions, serviceProvider);
        if (!permissionsResult.ok) {
            return permissionsResult;
        }

        const existingProvider: Option<ServiceProvider<true>> = await this.serviceProviderRepo.findById(
            serviceProvider.id,
        );
        if (!existingProvider) {
            return Err(new EntityNotFoundError('ServiceProvider', serviceProvider.id));
        }

        const frozenProperties: ServiceProviderUpdateParams = this.getFrozenProperties(
            existingProvider,
            permissionsResult.value,
        );
        const updateError: Option<InvalidLogoCombinationError> = serviceProvider.update(frozenProperties);
        if (updateError) {
            return Err(updateError);
        }

        const duplicateNameError: Option<DuplicateNameError> = await this.validateUniqueName(serviceProvider);
        if (duplicateNameError) {
            return Err(duplicateNameError);
        }

        const {
            hasRollenartenWhitelistChanged,
            forbiddenRollenarten,
        }: { hasRollenartenWhitelistChanged: boolean; forbiddenRollenarten: RollenArt[] } = this.getWhitelistChange(
            existingProvider,
            serviceProvider,
        );

        if (hasRollenartenWhitelistChanged) {
            const rollenWithServiceProvider: Map<ServiceProviderID, Rolle<true>[]> =
                await this.rolleRepo.findByServiceProviderIds([serviceProvider.id]);
            const forbiddenRollenartenSet: Set<RollenArt> = new Set(forbiddenRollenarten);
            if (
                rollenWithServiceProvider.has(serviceProvider.id) &&
                rollenWithServiceProvider
                    .get(serviceProvider.id)!
                    .some((rolle: Rolle<true>) => forbiddenRollenartenSet.has(rolle.rollenart))
            ) {
                return Err(
                    new AttachedRollenError(
                        'Cannot update rollenartenWhitelist with conflicting rollenarten to attached to rollen',
                        serviceProvider.id,
                    ),
                );
            }
        }

        const hasVerfuegbarFuerRollenerweiterungMerkmalBeenRemoved: boolean =
            !serviceProvider.merkmale.includes(ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG) &&
            existingProvider.merkmale.includes(ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG);
        if (hasRollenartenWhitelistChanged || hasVerfuegbarFuerRollenerweiterungMerkmalBeenRemoved) {
            await this.rollenerweiterungRepo.deleteByServiceProviderIdAndRollenarten(
                serviceProvider.id,
                hasVerfuegbarFuerRollenerweiterungMerkmalBeenRemoved ? undefined : forbiddenRollenarten,
            );
        }

        const persistedServiceProvider: ServiceProvider<true> =
            await this.serviceProviderInternalRepo.persistAndFlush(serviceProvider);

        return Ok(persistedServiceProvider);
    }

    public async deleteByIdAuthorized(
        permissions: IPersonPermissions,
        id: ServiceProviderID,
    ): Promise<
        Result<
            void,
            | EntityNotFoundError
            | MissingPermissionsError
            | AttachedRollenError
            | AttachedRollenerweiterungenError
            | VidisServiceProviderImmutableError
        >
    > {
        const serviceProvider: Option<ServiceProvider<true>> = await this.serviceProviderRepo.findById(id);
        if (!serviceProvider) {
            return Err(new EntityNotFoundError('ServiceProvider', id));
        }

        if (serviceProvider.vidisAngebotId) {
            return Err(
                new VidisServiceProviderImmutableError(
                    'ServiceProvider linked to VIDIS cannot be updated or deleted',
                    id,
                ),
            );
        }

        const rollen: Map<ServiceProviderID, Rolle<true>[]> = await this.rolleRepo.findByServiceProviderIds([id], 1);
        const hasAttachedRollen: boolean = (rollen.get(id)?.length ?? 0) > 0;
        if (hasAttachedRollen) {
            return Err(new AttachedRollenError('ServiceProvider has attached Rollen and cannot be deleted', id));
        }

        const rollenerweiterungen: Record<ServiceProviderID, number> =
            await this.rollenerweiterungRepo.countByServiceProviderIds([id]);
        const hasAttachedRollenerweiterungen: boolean = (rollenerweiterungen[id] ?? 0) > 0;
        if (hasAttachedRollenerweiterungen) {
            return Err(
                new AttachedRollenerweiterungenError(
                    'ServiceProvider has attached Rollenerweiterungen and cannot be deleted',
                    id,
                ),
            );
        }

        return this.serviceProviderRepo.deleteByIdAuthorized(permissions, id);
    }

    private async validateUniqueName(
        serviceProvider: ServiceProvider<true> | ServiceProvider<false>,
    ): Promise<Option<DuplicateNameError>> {
        if (
            !(await new NameUniqueAtOrgaSpecification(this.serviceProviderInternalRepo).isSatisfiedBy(serviceProvider))
        ) {
            return new DuplicateNameError(
                `Duplicate name error: ${serviceProvider.name}`,
                serviceProvider.id ?? undefined,
            );
        }

        return;
    }

    private getFrozenProperties(
        existingProvider: ServiceProvider<true>,
        permission: ServiceProviderPropertyPermissions,
    ): ServiceProviderUpdateParams {
        const frozenProperties: ServiceProviderUpdateParams = {
            requires2fa: existingProvider.requires2fa,
        };

        if (permission === ServiceProviderPropertyPermissions.EINGESCHRAENKT) {
            frozenProperties.kategorie = existingProvider.kategorie;
            frozenProperties.merkmale = existingProvider.merkmale;
            frozenProperties.rollenartenWhitelist = existingProvider.rollenartenWhitelist;
        }

        return frozenProperties;
    }

    private getWhitelistChange(
        existingProvider: ServiceProvider<true>,
        serviceProvider: ServiceProvider<true>,
    ): {
        hasRollenartenWhitelistChanged: boolean;
        forbiddenRollenarten: RollenArt[];
    } {
        const hasRollenartenWhitelistChanged: boolean = !isEqual(
            existingProvider.rollenartenWhitelist,
            serviceProvider.rollenartenWhitelist,
        );

        const forbiddenRollenarten: RollenArt[] =
            serviceProvider.rollenartenWhitelist.length === 0
                ? []
                : difference(Object.values(RollenArt), serviceProvider.rollenartenWhitelist);

        return { hasRollenartenWhitelistChanged, forbiddenRollenarten };
    }
}
