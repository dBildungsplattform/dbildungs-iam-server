import { DomainError } from '../../../shared/error/domain.error.js';

export class LdapDeleteOrganisationError extends DomainError {
    public constructor(details?: unknown[] | Record<string, unknown>) {
        super(`LDAP error: organisation could not be deleted`, 'DELETE_ORGANISATION_FAILED', details);
    }
}
