import { DomainError } from '../../../shared/error/index.js';
import { LdapEntityType } from '../domain/ldap.types.js';

export class LdapSearchError extends DomainError {
    public constructor(
        entityType: LdapEntityType,
        uid?: string,
        ou?: string,
        details?: unknown[] | Record<string, unknown>,
    ) {
        super(`LDAP search for ${entityType}, uid=${uid}, ou=${ou} resulted in an error`, 'ENTITY_NOT_FOUND', details);
    }
}
