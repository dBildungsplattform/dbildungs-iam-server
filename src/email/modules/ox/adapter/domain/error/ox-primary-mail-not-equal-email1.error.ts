import { OxNonRetryableError } from './ox-non-retryable.error.js';

export class OxPrimaryMailNotEqualEmail1Error extends OxNonRetryableError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'OX_PRIMARY_MAIL_NOT_EQUAL_EMAIL1_ERROR', details);
    }
}
