import { DomainError } from '../../../../shared/error/domain.error.js';

export class EmailAddressMissingStatusError extends DomainError {
    public constructor(address: string, details?: unknown[] | Record<string, unknown>) {
        super(`EmailAddress with the address:${address} is missing a status`, 'MISSING_STATUS', details);
    }
}
