import { DomainError } from "../../../shared/error/domain.error.js";

export class LdapDeleteRoleError extends DomainError {
    public constructor(details?: unknown[] | Record<string, unknown>) {
        super(`LDAP error: role could not be deleted`, 'DELETE_ROLE_FAILED', details);
    }
}