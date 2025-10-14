import { OxNonRetryableError } from './ox-non-retryable.error';
export class OxNoSuchUserError extends OxNonRetryableError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'OX_NO_SUCH_USER_ERROR', details);
    }
}
