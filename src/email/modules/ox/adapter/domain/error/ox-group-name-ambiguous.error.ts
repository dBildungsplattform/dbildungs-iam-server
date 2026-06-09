import { OxNonRetryableError } from './ox-non-retryable.error.js';

export class OxGroupNameAmbiguousError extends OxNonRetryableError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'OX_GROUP_NAME_AMBIGUOUS_ERROR', details);
    }
}
