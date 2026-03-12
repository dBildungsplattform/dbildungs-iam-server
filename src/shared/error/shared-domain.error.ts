import { DomainError } from './domain.error.js';

export class SharedDomainError extends DomainError {
    public constructor(
        public override readonly message: string,
        public override readonly code: string = 'GENERIC_SHARED_ERROR',
        public override readonly details?: unknown[] | Record<string, unknown>,
    ) {
        super(message, code, details);
    }
}
