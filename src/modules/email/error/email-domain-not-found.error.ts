import { DomainError } from '../../../shared/error/index.js';
import { OrganisationID, PersonID } from '../../../shared/types/aggregate-ids.types.js';

export class EmailDomainNotFoundError extends DomainError {
    public constructor(
        personId: PersonID,
        organisationIds: OrganisationID[],
        details?: unknown[] | Record<string, unknown>,
    ) {
        super(
            `Could not find emailDomain in organisations for personId:${personId}, organisationsIds:${JSON.stringify(organisationIds)}`,
            'ENTITY_NOT_FOUND',
            details,
        );
    }
}
