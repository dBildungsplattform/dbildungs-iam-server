import { SharedDomainError } from './index.js';

export class MismatchedRevisionError extends SharedDomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'MISMATCHED_REVISION', details);
    }
}
