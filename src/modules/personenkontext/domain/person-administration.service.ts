import { Injectable } from '@nestjs/common';
import { intersection } from 'lodash-es';

import { OrganisationID } from '../../../shared/types/aggregate-ids.types.js';
import { PermittedOrgas, PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { OrganisationMatchesRollenart } from '../../rolle/domain/specification/organisation-matches-rollenart.js';
import { RollenSystemRecht } from '../../rolle/domain/systemrecht.js';
import { RolleFindByParameters, RolleRepo } from '../../rolle/repo/rolle.repo.js';

@Injectable()
export class PersonAdministrationService {
    public constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly organisationRepository: OrganisationRepository,
    ) {}

    public async findAuthorizedRollen(
        permissions: PersonPermissions,
        rolleName?: string,
        limit?: number,
        organisationIds?: Array<OrganisationID>,
    ): Promise<Rolle<true>[]> {
        const permittedOrgas: PermittedOrgas = await permissions.getOrgIdsWithSystemrecht(
            [RollenSystemRecht.PERSONEN_VERWALTEN],
            true,
        );

        /** Filters for Rollenarten and Schulstrukturknoten are derived from these. Undefined means "no filter". */
        let relevantOrganisationIdsForFilter: Array<OrganisationID> | undefined;
        if (permittedOrgas.all) {
            relevantOrganisationIdsForFilter = this.hasSelectedOrgas(organisationIds) ? organisationIds : undefined;
        } else {
            if (permittedOrgas.orgaIds.length === 0) {
                return [];
            }
            relevantOrganisationIdsForFilter = this.hasSelectedOrgas(organisationIds)
                ? intersection(permittedOrgas.orgaIds, organisationIds)
                : permittedOrgas.orgaIds;
        }

        const query: RolleFindByParameters = {
            limit,
            searchStr: rolleName,
        };

        if (relevantOrganisationIdsForFilter) {
            const [rollenarten, schulstrukturknotenIds]: [Array<RollenArt>, Array<OrganisationID>] = await Promise.all([
                this.getAllowedRollenArtenForOrganisationen(relevantOrganisationIdsForFilter),
                this.getAllowedSchulstrukturknotenForRollen(relevantOrganisationIdsForFilter),
            ]);
            query.rollenArten = rollenarten;
            query.allowedOrganisationIds = schulstrukturknotenIds;
        }

        const [rollen, _]: Counted<Rolle<true>> = await this.rolleRepo.findBy(query);
        return rollen;
    }

    private hasSelectedOrgas(organisationIds?: Array<OrganisationID>): organisationIds is Array<OrganisationID> {
        return (organisationIds?.length ?? 0) > 0;
    }

    private async getAllowedRollenArtenForOrganisationen(orgaIds: Array<OrganisationID>): Promise<Array<RollenArt>> {
        const distinctOrganisationsTypen: Array<OrganisationsTyp> =
            await this.organisationRepository.findDistinctOrganisationsTypen(orgaIds);

        const allowedRollenarten: Set<RollenArt> = new Set();
        distinctOrganisationsTypen.forEach((organisationsTyp: OrganisationsTyp) => {
            OrganisationMatchesRollenart.getAllowedRollenartenForOrganisationsTyp(organisationsTyp).forEach(
                (allowedRollenart: RollenArt) => {
                    allowedRollenarten.add(allowedRollenart);
                },
            );
        });
        return Array.from(allowedRollenarten);
    }

    private async getAllowedSchulstrukturknotenForRollen(
        orgaIds: Array<OrganisationID>,
    ): Promise<Array<OrganisationID>> {
        const parentsOfPermittedOrgas: Array<Organisation<true>> =
            await this.organisationRepository.findParentOrgasForIds(orgaIds);

        const allowedStrukturknoten: Set<OrganisationID> = new Set(orgaIds);
        parentsOfPermittedOrgas.forEach((o: Organisation<true>) => allowedStrukturknoten.add(o.id));

        return Array.from(allowedStrukturknoten);
    }
}
