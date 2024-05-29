import { PersonenkontextSpecificationError } from './personenkontext-specification.error.js';
import { OrganisationID, PersonID, RolleID } from '../../../../shared/types/index.js';

export class PersonenkontexteUpdateNotFoundError extends PersonenkontextSpecificationError {
    public constructor(
        personId: PersonID,
        organisationId: OrganisationID,
        rolleId: RolleID,
        details?: unknown[] | Record<string, undefined>,
    ) {
        super(
            `Personenkontexte could not be updated because Personenkontext personId:${personId}, organisationId:${organisationId}, rolleId:${rolleId} was not found.`,
            details,
        );
    }
}
