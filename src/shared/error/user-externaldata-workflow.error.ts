import { DomainError } from './domain.error.js';

export class UserExternalDataWorkflowError extends DomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'USER_EXTERNALDATA_WORKFLOW', details);
    }
}
