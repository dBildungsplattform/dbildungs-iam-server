import { OxNonRetryableError } from './ox-non-retryable.error.js';

export class OxGroupNotFoundError extends OxNonRetryableError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'OX_GROUP_NOT_FOUND_ERROR', details);
    }
}
