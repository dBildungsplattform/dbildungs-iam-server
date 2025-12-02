import { DomainError } from '../../../../shared/error/domain.error.js';

export class LdapModifyPersonError extends DomainError {
    public constructor(details?: unknown[] | Record<string, unknown>) {
        super(`LDAP error: Modifying lehrer FAILED`, 'LDAP_LEHRER_MODIFY_FAILED', details);
    }
}
