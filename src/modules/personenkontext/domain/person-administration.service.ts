import { Injectable } from '@nestjs/common';
import { intersection } from 'lodash-es';
import { OrganisationID } from '../../../shared/types/aggregate-ids.types.js';
import { PermittedOrgas, PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RollenSystemRecht } from '../../rolle/domain/systemrecht.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationMatchesRollenart } from '../specification/organisation-matches-rollenart.js';

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

        let rollenarten: Array<RollenArt> | undefined;
        let schulstrukturknoten: Array<OrganisationID> | undefined;
        if (permittedOrgas.all) {
            if (this.hasSelectedOrgas(organisationIds)) {
                rollenarten = await this.getAllowedRollenArtenForOrganisationen(organisationIds);
                schulstrukturknoten = await this.getAllowedSchulstrukturknotenForRollen(organisationIds);
            } else {
                // no selection, everything is permitted, leave filters empty
            }
        } else {
            if (permittedOrgas.orgaIds.length === 0) {
                return [];
            }
            if (this.hasSelectedOrgas(organisationIds)) {
                const selectedAndPermittedOrgasIds: Array<OrganisationID> = intersection(
                    permittedOrgas.orgaIds,
                    organisationIds,
                );
                rollenarten = await this.getAllowedRollenArtenForOrganisationen(selectedAndPermittedOrgasIds);
                schulstrukturknoten = await this.getAllowedSchulstrukturknotenForRollen(selectedAndPermittedOrgasIds);
            } else {
                rollenarten = await this.getAllowedRollenArtenForOrganisationen(permittedOrgas.orgaIds);
                schulstrukturknoten = await this.getAllowedSchulstrukturknotenForRollen(permittedOrgas.orgaIds);
            }
        }

        return this.rolleRepo.findBy(rolleName, rollenarten, schulstrukturknoten, limit);
    }

    private hasSelectedOrgas(organisationIds?: Array<OrganisationID>): organisationIds is Array<OrganisationID> {
        return (organisationIds?.length ?? 0) > 0;
    }

    private async getAllowedRollenArtenForOrganisationen(orgaIds: Array<OrganisationID>): Promise<Array<RollenArt>> {
        const organisationen: Map<OrganisationID, Organisation<true>> = await this.organisationRepository.findByIds(
            orgaIds,
        );
        const organisationsTypen: Set<OrganisationsTyp> = new Set();
        organisationen.forEach((orga: Organisation<true>) => {
            if (orga.typ) {
                organisationsTypen.add(orga.typ);
            }
        });

        const allowedRollenarten: Set<RollenArt> = new Set();
        organisationsTypen.forEach((organisationsTyp: OrganisationsTyp) => {
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
        parentsOfPermittedOrgas.forEach((orga: Organisation<true>) => allowedStrukturknoten.add(orga.id));
        return Array.from(allowedStrukturknoten);
    }
}
