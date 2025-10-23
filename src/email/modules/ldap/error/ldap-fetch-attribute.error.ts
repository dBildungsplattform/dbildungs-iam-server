import { DomainError } from '../../../../shared/error/domain.error.js';
import { PersonID } from '../../../../shared/types';

export class LdapFetchAttributeError extends DomainError {
    public constructor(
        attributeName: string,
        uid: string,
        personId: PersonID | undefined,
        details?: unknown[] | Record<string, unknown>,
    ) {
        super(
            `Error while fetching attribute:${attributeName}, uid:${uid}, personId:${personId}`,
            'LDAP_FETCH_ATTRIBUTE_ERROR',
            details,
        );
    }
}
