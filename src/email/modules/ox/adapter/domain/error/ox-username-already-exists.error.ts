import { OxNonRetryableError } from './ox-non-retryable.error.js';

export class OxUsernameAlreadyExistsError extends OxNonRetryableError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'OX_USERNAME_ALREADY_EXISTS_ERROR', details);
    }
}
