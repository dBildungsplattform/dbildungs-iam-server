import { Injectable } from '@nestjs/common';

import { DomainError } from '../../../shared/error/domain.error.js';
import { IPersonPermissions } from '../../../shared/permissions/person-permissions.interface.js';
import { ServiceProviderPropertyPermissions, ServiceProviderRepo } from '../repo/service-provider.repo.js';
import { ServiceProvider } from './service-provider.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { Err, Ok } from '../../../shared/util/result.js';
import { ServiceProviderKategorie, ServiceProviderMerkmal } from './service-provider.enum.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { objectKeys, assignSameKey } from '../../../shared/util/object-utils.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { DuplicateNameError } from '../specification/error/duplicate-name.error.js';
import { NameUniqueAtOrgaSpecification } from '../specification/name-unique-at-orga.specification.js';
import { ServiceProviderInternalRepo } from '../repo/service-provider.internal.repo.js';
import { ServiceProviderID } from '../../../shared/types/aggregate-ids.types.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { AttachedRollenError } from './errors/attached-rollen.error.js';
import { RollenerweiterungRepo } from '../../rolle/repo/rollenerweiterung.repo.js';

/**
 * Used when person doesn't have full rights to create/update serviceprovider.
 * - Use these values as default, when creating service providers
 * - Use the keys to copy values of existing service provider, when updating
 */
const SP_EINGESCHRAENKT_DEFAULTS: Partial<ServiceProvider<true>> = {
    merkmale: [
        ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG,
        ServiceProviderMerkmal.NACHTRAEGLICH_ZUWEISBAR,
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
            for (const key of objectKeys(SP_EINGESCHRAENKT_DEFAULTS)) {
                assignSameKey<Partial<ServiceProvider<false>>, keyof Partial<ServiceProvider<false>>>(
                    serviceProvider,
                    SP_EINGESCHRAENKT_DEFAULTS,
                    key,
                );
            }
            if (serviceProvider.rollenartenWhitelist.length > 0) {
                return Err(new MissingPermissionsError('Insufficient permissions to set rollenartenWhitelist'));
            }
            if (
                serviceProvider.merkmale.includes(ServiceProviderMerkmal.ANBIETEN_IN_SCHULISCHER_ANGEBOTSVERWALTUNG) ||
                serviceProvider.merkmale.includes(ServiceProviderMerkmal.ANBIETEN_IN_SCHULISCHER_ROLLENVERWALTUNG)
            ) {
                return Err(
                    new MissingPermissionsError(
                        'Insufficient permissions to set merkmale ANBIETEN_IN_SCHULISCHER_ANGEBOTSVERWALTUNG || ANBIETEN_IN_SCHULISCHER_ROLLENVERWALTUNG',
                    ),
                );
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

        // Not allowed to modify this serviceprovider
        if (!permissionsResult.ok) {
            return permissionsResult;
        }

        const existingProvider: Option<ServiceProvider<true>> = await this.serviceProviderRepo.findById(
            serviceProvider.id,
        );

        if (!existingProvider) {
            return Err(new EntityNotFoundError('ServiceProvider', serviceProvider.id));
        }

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

        // Use some existing values if person only has partial system rights
        if (permissionsResult.value === ServiceProviderPropertyPermissions.EINGESCHRAENKT) {
            const hasSchulischeAngebotsverwaltungMerkmalChanged: boolean =
                serviceProvider.merkmale.includes(ServiceProviderMerkmal.ANBIETEN_IN_SCHULISCHER_ANGEBOTSVERWALTUNG) !==
                existingProvider.merkmale.includes(ServiceProviderMerkmal.ANBIETEN_IN_SCHULISCHER_ANGEBOTSVERWALTUNG);
            const hasSchulischeRollenverwaltungMerkmalChanged: boolean =
                serviceProvider.merkmale.includes(ServiceProviderMerkmal.ANBIETEN_IN_SCHULISCHER_ROLLENVERWALTUNG) !==
                existingProvider.merkmale.includes(ServiceProviderMerkmal.ANBIETEN_IN_SCHULISCHER_ROLLENVERWALTUNG);

            if (hasRollenartenWhitelistChanged) {
                return Err(new MissingPermissionsError('Insufficient permissions to set rollenartenWhitelist'));
            }
            if (hasSchulischeAngebotsverwaltungMerkmalChanged || hasSchulischeRollenverwaltungMerkmalChanged) {
                return Err(
                    new MissingPermissionsError(
                        'Insufficient permissions to set merkmale ANBIETEN_IN_SCHULISCHER_ANGEBOTSVERWALTUNG || ANBIETEN_IN_SCHULISCHER_ROLLENVERWALTUNG',
                    ),
                );
            }

            for (const key of objectKeys(SP_EINGESCHRAENKT_DEFAULTS)) {
                assignSameKey(serviceProvider, existingProvider, key);
            }
        }

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
