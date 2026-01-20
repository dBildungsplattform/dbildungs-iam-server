import { DomainError } from '../../../../shared/error/domain.error.js';

export class LdapCreatePersonError extends DomainError {
    public constructor(details?: unknown[] | Record<string, unknown>) {
        super(`LDAP error: Creating lehrer FAILED`, 'LDAP_LEHRER_CREATION_FAILED', details);
    }
}
