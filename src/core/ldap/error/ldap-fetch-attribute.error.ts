import { DomainError } from '../../../shared/error/index.js';
import { PersonID, PersonReferrer } from '../../../shared/types/aggregate-ids.types.js';

export class LdapFetchAttributeError extends DomainError {
    public constructor(
        attributeName: string,
        referrer: PersonReferrer,
        personId: PersonID,
        details?: unknown[] | Record<string, unknown>,
    ) {
        super(
            `Error while fetching attribute:${attributeName}, referrer:${referrer}, personId:${personId}`,
            'LDAP_FETCH_ATTRIBUTE_ERROR',
            details,
        );
    }
}
