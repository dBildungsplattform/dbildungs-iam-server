import { DomainError } from './domain.error.js';

export class UserAuthenticationFailedError extends DomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'USER_AUTHENTICATION_FAILED_ERROR', details);
    }
}
