import { DomainError } from '../../../../shared/error/domain.error.js';

export class EmailCreationFailedError extends DomainError {
    public constructor(spshPersonId: string, details?: unknown[] | Record<string, unknown>) {
        super(`Creating Email for spshPersonId: ${spshPersonId} failed`, 'EMAIL_CREATION_FAILED', details);
    }
}
