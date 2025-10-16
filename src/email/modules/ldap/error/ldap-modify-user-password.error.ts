import { DomainError } from '../../../../shared/error/domain.error.js';

export class LdapModifyUserPasswordError extends DomainError {
    public constructor(details?: unknown[] | Record<string, unknown>) {
        super(`LDAP error: Modifying userPassword FAILED`, 'LDAP_USER_PASSWORD_MODIFICATION_FAILED', details);
    }
}
