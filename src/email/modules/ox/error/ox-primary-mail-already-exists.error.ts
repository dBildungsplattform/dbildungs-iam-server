import { OxNonRetryableError } from './ox-non-retryable.error.js';

export class OxPrimaryMailAlreadyExistsError extends OxNonRetryableError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'OX_PRIMARY_MAIL_ALREADY_EXISTS_ERROR', details);
    }
}
