import { OxError } from '../../../../shared/error/ox.error.js';

export class OxNonRetryableError extends OxError {
    public constructor(
        message: string,
        code: string = 'OX_NON_RETRYABLE_ERROR',
        details?: unknown[] | Record<string, unknown>,
    ) {
        super(message, code, details);
    }
}
