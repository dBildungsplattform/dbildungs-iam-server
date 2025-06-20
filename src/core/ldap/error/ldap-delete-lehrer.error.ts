import { DomainError } from '../../../shared/error/index.js';

export class LdapDeleteLehrerError extends DomainError {
    public constructor(details?: unknown[] | Record<string, unknown>) {
        super(`LDAP error: Deleting lehrer FAILED`, 'LDAP_LEHRER_DELETION_FAILED', details);
    }
}
