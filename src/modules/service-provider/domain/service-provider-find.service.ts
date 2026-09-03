import { Injectable } from '@nestjs/common';

import { DomainError } from '../../../shared/error/domain.error.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { IPersonPermissions } from '../../../shared/permissions/person-permissions.interface.js';
import { OrganisationID } from '../../../shared/types/aggregate-ids.types.js';
import { Err, Ok } from '../../../shared/util/result.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { RollenSystemRecht } from '../../rolle/domain/systemrecht.js';
import { ServiceProviderRepo } from '../repo/service-provider.repo.js';
import { ServiceProvider } from './service-provider.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';

@Injectable()
export class ServiceProviderFindService {
    public constructor(
        private readonly organisationRepo: OrganisationRepository,
        private readonly serviceProviderRepo: ServiceProviderRepo,
    ) {}

    public async findServiceProvidersForRolleBySchulstrukturknotenAuthorized(
        permissions: IPersonPermissions,
        schulstrukturknotenId: OrganisationID,
        rollenArten?: RollenArt[],
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

        if (rollenArten && rollenArten.length > 0) {
            const filteredServiceProviders: ServiceProvider<true>[] = serviceProviders.filter(
                (sp: ServiceProvider<true>) =>
                    sp.rollenartenWhitelist.some((ra: RollenArt) => rollenArten.includes(ra)),
            );
            return Ok(filteredServiceProviders);
        }

        return Ok(serviceProviders);
    }
}
