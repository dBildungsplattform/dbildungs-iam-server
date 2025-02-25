import { DomainError } from '../../../shared/error/index.js';

export class LdapGroupKennungExtractionError extends DomainError {
    public constructor(description: string, details?: unknown[] | Record<string, unknown>) {
        super(
            `LDAP error: Could not extract group kennung from group-DN, ${description}`,
            'LDAP_GROUP_KENNUNG_EXTRACTION_FAILED',
            details,
        );
    }
}
