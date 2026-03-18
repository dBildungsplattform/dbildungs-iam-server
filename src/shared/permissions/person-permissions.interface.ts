/* v8 ignore file @preserv */
// type definitions can not be covered by v8, since the code does not exist at runtime
import { OrganisationID, PersonID, RolleID } from '../types/index.js';
import { RollenSystemRecht } from '../../modules/rolle/domain/systemrecht.js';
import { PermittedOrgas, PersonenkontextRolleWithOrganisation } from '../../modules/authentication/domain/person-permissions.js';
import { Personenkontext } from '../../modules/personenkontext/domain/personenkontext.js';
import { OrganisationsTyp } from '../../modules/organisation/domain/organisation.enums.js';

export type IPersonPermissions = {
    hasSystemrechteAtOrganisation(organisationId: OrganisationID, systemrechte: RollenSystemRecht[]): Promise<boolean>;

    hasSystemrechtAtOrganisation(organisationId: OrganisationID, systemrechte: RollenSystemRecht): Promise<boolean>;

    hasSystemrechteAtRootOrganisation(systemrechte: RollenSystemRecht[], matchAll: boolean): Promise<boolean>;

    getOrgIdsWithSystemrecht(
        systemrechte: RollenSystemRecht[],
        withChildren: boolean,
        matchAll: boolean,
    ): Promise<PermittedOrgas>;

    canModifyPerson(personId: PersonID): Promise<boolean>;

    getRoleIds(): Promise<RolleID[]>;

    getPersonenkontextIds(): Promise<Pick<Personenkontext<true>, 'organisationId' | 'rolleId'>[]>

    getPersonenkontexteWithRolesAndOrgs(): Promise<PersonenkontextRolleWithOrganisation[]>

    hasOrgVerwaltenRechtAtOrga(typ: OrganisationsTyp, administriertVon?: string): Promise<boolean>
};
