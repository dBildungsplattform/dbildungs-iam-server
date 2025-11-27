import { DomainError } from '../../../../shared/error/domain.error.js';

export class EmailUpdateInProgressError extends DomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'UPDATE_IN_PROGRESS', details);
    }
}
