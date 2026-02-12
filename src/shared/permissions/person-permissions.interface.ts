/* v8 ignore file @preserv */
// type definitions can not be covered by v8, since the code does not exist at runtime
import { OrganisationID, PersonID } from '../types/index.js';
import { RollenSystemRecht } from '../../modules/rolle/domain/systemrecht.js';

export type IPersonPermissions = {
    hasSystemrechteAtOrganisation(organisationId: OrganisationID, systemrechte: RollenSystemRecht[]): Promise<boolean>;

    hasSystemrechtAtOrganisation(organisationId: OrganisationID, systemrechte: RollenSystemRecht): Promise<boolean>;

    canModifyPerson(personId: PersonID): Promise<boolean>;
};
