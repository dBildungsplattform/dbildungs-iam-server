import { OxNonRetryableError } from './ox-non-retryable.error.js';

export class OxMemberAlreadyInGroupError extends OxNonRetryableError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'OX_MEMBER_ALREADY_IN_GROUP_ERROR', details);
    }
}
