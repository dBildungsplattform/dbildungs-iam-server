import { DomainError } from '../../../../shared/error';

export class LdapAddPersonToGroupError extends DomainError {
    public constructor(details?: unknown[] | Record<string, unknown>) {
        super(`LDAP error: Adding person to group FAILED`, 'LDAP_ADD_PERSON_TO_GROUP_FAILED', details);
    }
}
