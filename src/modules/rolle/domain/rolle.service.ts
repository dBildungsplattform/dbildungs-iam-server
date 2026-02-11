import { Injectable } from '@nestjs/common';
import { ScopeOperator } from '../../../shared/persistence/scope.enums.js';
import { OrganisationID } from '../../../shared/types/aggregate-ids.types.js';
import {
    intersectPermittedAndRequestedOrgas,
    PermittedOrgas,
    PersonPermissions,
} from '../../authentication/domain/person-permissions.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { RolleRepo } from '../repo/rolle.repo.js';
import { RolleScope } from '../repo/rolle.scope.js';
import { RollenArt } from './rolle.enums.js';
import { Rolle } from './rolle.js';
import { RollenSystemRecht } from './systemrecht.js';

export interface FindRollenWithPermissionsParams {
    permissions: PersonPermissions;
    searchStr?: string;
    organisationIds?: Array<OrganisationID>;
    rollenArten?: Array<RollenArt>;
    limit?: number;
    offset?: number;
}

@Injectable()
export class RolleService {
    public constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly organisationRepository: OrganisationRepository,
    ) {}

    public async findRollenAvailableForErweiterung(
        params: FindRollenWithPermissionsParams,
    ): Promise<Counted<Rolle<true>>> {
        const permittedOrgas: PermittedOrgas = await params.permissions.getOrgIdsWithSystemrecht(
            [RollenSystemRecht.ROLLEN_ERWEITERN],
            true,
        );
        if (permittedOrgas.all === false && permittedOrgas.orgaIds.length === 0) {
            return [[], 0];
        }

        let organisationenIds: OrganisationID[] | undefined;
        if (params.organisationIds && params.organisationIds.length > 0) {
            organisationenIds = intersectPermittedAndRequestedOrgas(permittedOrgas, params.organisationIds);
        } else if (permittedOrgas.all === false) {
            organisationenIds = permittedOrgas.orgaIds;
        }
        if (organisationenIds !== undefined) {
            organisationenIds = await this.getOrganisationIdsWithParents(organisationenIds);
            if (organisationenIds.length === 0) {
                return [[], 0];
            }
        }

        const scope: RolleScope = new RolleScope()
            .setScopeWhereOperator(ScopeOperator.AND)
            .findByRollenArten(params.rollenArten)
            .findByOrganisationen(organisationenIds)
            .paged(params.offset, params.limit);

        if (params.searchStr) {
            scope.findBySubstring(['name'], params.searchStr);
        }

        return this.rolleRepo.findBy(scope);
    }

    private async getOrganisationIdsWithParents(organisationIds: OrganisationID[]): Promise<OrganisationID[]> {
        const organisationIdsWithParents: Set<OrganisationID> = new Set(organisationIds);
        const parents: Organisation<true>[] = await this.organisationRepository.findParentOrgasForIds(organisationIds);
        parents.forEach((parent: Organisation<true>) => organisationIdsWithParents.add(parent.id));
        return Array.from(organisationIdsWithParents);
    }
}
