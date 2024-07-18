import { OrganisationID, PersonID } from '../../../shared/types/index.js';
import { RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';

export type IPersonPermissions = {
    hasSystemrechtAtOrganisation(organisationId: OrganisationID, systemrechte: RollenSystemRecht[]): Promise<boolean>;

    canModifyPerson(personId: PersonID): Promise<boolean>;
};
