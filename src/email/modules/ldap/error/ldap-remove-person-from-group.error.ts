import { DomainError } from '../../../../shared/error';

export class LdapRemovePersonFromGroupError extends DomainError {
    public constructor(details?: unknown[] | Record<string, unknown>) {
        super(`LDAP error: Removing person from group FAILED`, 'LDAP_REMOVE_PERSON_FROM_GROUP_FAILED', details);
    }
}
