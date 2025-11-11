import { OxNonRetryableError } from '../../../../modules/ox/error/ox-non-retryable.error.js';

export class OxDisplaynameAlreadyUsedError extends OxNonRetryableError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'OX_DISPLAY_NAME_ALREADY_USED_ERROR', details);
    }
}
