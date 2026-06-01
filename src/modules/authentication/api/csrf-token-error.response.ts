import { SharedDomainError } from '../../../shared/error/shared-domain.error.js';

export class CsrfTokenErrorResponse extends SharedDomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'CSRF_TOKEN_ERROR', details);
    }
}
