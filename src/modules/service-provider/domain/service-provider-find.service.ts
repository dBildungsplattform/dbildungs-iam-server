import { Injectable } from '@nestjs/common';

import { DomainError } from '../../../shared/error/domain.error.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { IPersonPermissions } from '../../../shared/permissions/person-permissions.interface.js';
import { OrganisationID } from '../../../shared/types/aggregate-ids.types.js';
import { Err, Ok } from '../../../shared/util/result.js';
import { PermittedOrgas } from '../../authentication/domain/person-permissions.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { RollenSystemRecht } from '../../rolle/domain/systemrecht.js';
import { ServiceProviderRepo } from '../repo/service-provider.repo.js';
import { ServiceProvider } from './service-provider.js';

@Injectable()
export class ServiceProviderFindService {
    public constructor(
        private readonly organisationRepo: OrganisationRepository,
        private readonly serviceProviderRepo: ServiceProviderRepo,
    ) {}

    public async findServiceProvidersForRolleBySchulstrukturknotenAuthorized(
        permissions: IPersonPermissions,
        schulstrukturknotenId: OrganisationID,
    ): Promise<Result<ServiceProvider<true>[], DomainError>> {
        const hasPermission: boolean = await permissions.hasSystemrechteAtOrganisation(schulstrukturknotenId, [
            RollenSystemRecht.ROLLEN_VERWALTEN,
        ]);

        if (!hasPermission) {
            return Err(new MissingPermissionsError('Rollen Verwalten Systemrecht Required For This Endpoint'));
        }

        const parentOrganisations: Organisation<true>[] =
            await this.organisationRepo.findParentOrgasForIdSortedByDepthAsc(schulstrukturknotenId);
        const serviceProviders: ServiceProvider<true>[] = await this.serviceProviderRepo.findBySchulstrukturknoten(
            parentOrganisations.map((organisation: Organisation<true>) => organisation.id),
        );

        return Ok(serviceProviders);
    }

    public async findServiceProvidersForRollenVerwaltungAuthorized(
        permissions: IPersonPermissions,
    ): Promise<Result<ServiceProvider<true>[], DomainError>> {
        const permittedOrgas: PermittedOrgas = await permissions.getOrgIdsWithSystemrecht([
            RollenSystemRecht.ROLLEN_VERWALTEN,
        ]);

        if (permittedOrgas.all) {
            return Ok(await this.serviceProviderRepo.find());
        }

        if (permittedOrgas.orgaIds.length === 0) {
            return Err(new MissingPermissionsError('Rollen Verwalten Systemrecht Required For This Endpoint'));
        }

        const [parentOrgs, childOrgs]: [Organisation<true>[], Organisation<true>[]] = await Promise.all([
            this.organisationRepo.findParentOrgasForIds(permittedOrgas.orgaIds),
            this.organisationRepo.findChildOrgasForIds(permittedOrgas.orgaIds),
        ]);

        const allOrgIds: OrganisationID[] = [
            ...parentOrgs.map((org: Organisation<true>) => org.id),
            ...childOrgs.map((org: Organisation<true>) => org.id),
        ];

        const serviceProviders: ServiceProvider<true>[] =
            await this.serviceProviderRepo.findBySchulstrukturknoten(allOrgIds);

        return Ok(serviceProviders);
    }
}
