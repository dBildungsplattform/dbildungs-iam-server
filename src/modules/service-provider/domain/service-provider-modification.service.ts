import { Injectable } from '@nestjs/common';
import { xor } from 'lodash-es';

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
import { InvalidLogoCombinationError } from './errors/invalid-logo-combination.error.js';
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

        if (
            !(await new NameUniqueAtOrgaSpecification(this.serviceProviderInternalRepo).isSatisfiedBy(serviceProvider))
        ) {
            return Err(new DuplicateNameError(`Duplicate name error: ${serviceProvider.name}`));
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

        const frozenProperties: ServiceProviderUpdateParams = {
            requires2fa: existingProvider.requires2fa,
        };
        if (permissionsResult.value === ServiceProviderPropertyPermissions.EINGESCHRAENKT) {
            frozenProperties.kategorie = existingProvider.kategorie;
            frozenProperties.merkmale = existingProvider.merkmale;
            frozenProperties.rollenartenWhitelist = existingProvider.rollenartenWhitelist;
        }
        serviceProvider.update(frozenProperties);

        if (
            !(await new NameUniqueAtOrgaSpecification(this.serviceProviderInternalRepo).isSatisfiedBy(serviceProvider))
        ) {
            return Err(new DuplicateNameError(`Duplicate name error: ${serviceProvider.name}`, serviceProvider.id));
        }

        const hasRollenartenWhitelistChanged: boolean =
            serviceProvider.rollenartenWhitelist.length !== existingProvider.rollenartenWhitelist.length ||
            serviceProvider.rollenartenWhitelist.some(
                (rollenart: RollenArt) => !existingProvider.rollenartenWhitelist.includes(rollenart),
            );

        const forbiddenRollenarten: RollenArt[] =
            serviceProvider.rollenartenWhitelist.length === 0
                ? []
                : Object.values(RollenArt).filter(
                      (rollenart: RollenArt) => !serviceProvider.rollenartenWhitelist.includes(rollenart),
                  );

        if (hasRollenartenWhitelistChanged) {
            const rollenWithServiceProvider: Map<ServiceProviderID, Rolle<true>[]> =
                await this.rolleRepo.findByServiceProviderIds([serviceProvider.id]);
            if (
                rollenWithServiceProvider.has(serviceProvider.id) &&
                rollenWithServiceProvider
                    .get(serviceProvider.id)!
                    .some((rolle: Rolle<true>) => forbiddenRollenarten.includes(rolle.rollenart))
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
}
