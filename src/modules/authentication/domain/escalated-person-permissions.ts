/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */
import { IPersonPermissions } from '../../../shared/permissions/person-permissions.interface.js';
import { OrganisationID, PersonID, RolleID } from '../../../shared/types/index.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { RollenSystemRecht, RollenSystemRechtEnum } from '../../rolle/domain/systemrecht.js';
import { PermittedOrgas, PersonenkontextRolleWithOrganisation, PersonFields } from './person-permissions.js';

type EscalatedPermissionAtOrga = {
    orgaId: OrganisationID | 'ROOT';
    systemrechte: Array<RollenSystemRechtEnum> | 'ALL';
};

export class EscalatedPersonPermissions implements IPersonPermissions {
    private escalatedPermissions: Array<EscalatedPermissionAtOrga>;

    private constructor(escalatedPermissions: Array<EscalatedPermissionAtOrga>) {
        this.escalatedPermissions = escalatedPermissions;
    }

    public async getRoleIds(): Promise<RolleID[]> {
        throw new Error('Not implemented');
    }

    //Make Working
    public async getOrgIdsWithSystemrecht(
        systemrechte: RollenSystemRecht[],
        withChildren: boolean = false,
        matchAll: boolean = true,
    ): Promise<PermittedOrgas> {
        throw new Error('Not implemented');
    }

    //Make Working
    public async hasSystemrechteAtOrganisation(
        organisationId: OrganisationID,
        systemrechte: RollenSystemRecht[],
        matchAll: boolean = true,
    ): Promise<boolean> {
        throw new Error('Not implemented');
    }

    //Make Working
    public async hasSystemrechteAtRootOrganisation(
        systemrechte: RollenSystemRecht[],
        matchAll: boolean = true,
    ): Promise<boolean> {
        throw new Error('Not implemented');
    }

    //Make Working
    public async hasSystemrechtAtOrganisation(
        organisationId: OrganisationID,
        systemrecht: RollenSystemRecht,
    ): Promise<boolean> {
        throw new Error('Not implemented');
    }

    //Make Working
    public async canModifyPerson(personId: PersonID): Promise<boolean> {
        throw new Error('Not implemented');
    }

    public async getPersonenkontextIds(): Promise<Pick<Personenkontext<true>, 'organisationId' | 'rolleId'>[]> {
        throw new Error('Not implemented');
    }

    public async getPersonenkontexteWithRolesAndOrgs(): Promise<PersonenkontextRolleWithOrganisation[]> {
        throw new Error('Not implemented');
    }

    public get personFields(): PersonFields {
        throw new Error('Not implemented');
    }

    //Make Working
    public async hasOrgVerwaltenRechtAtOrga(typ: OrganisationsTyp, administriertVon?: string): Promise<boolean> {
        throw new Error('Not implemented');
    }
}
