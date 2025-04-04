import { OrganisationID, PersonID } from '../types/index.js';
import { RollenSystemRecht } from '../../modules/rolle/domain/rolle.enums.js';

export type IPersonPermissions = {
    hasSystemrechteAtOrganisation(organisationId: OrganisationID, systemrechte: RollenSystemRecht[]): Promise<boolean>;

    hasSystemrechtAtOrganisation(organisationId: OrganisationID, systemrechte: RollenSystemRecht): Promise<boolean>;

    canModifyPerson(personId: PersonID): Promise<boolean>;
};
