import { DomainError } from '../../../../shared/error';
import { PersonID, PersonReferrer } from '../../../../shared/types';

export class LdapFetchAttributeError extends DomainError {
    public constructor(
        attributeName: string,
        username: PersonReferrer,
        personId: PersonID | undefined,
        details?: unknown[] | Record<string, unknown>,
    ) {
        super(
            `Error while fetching attribute:${attributeName}, username:${username}, personId:${personId}`,
            'LDAP_FETCH_ATTRIBUTE_ERROR',
            details,
        );
    }
}
