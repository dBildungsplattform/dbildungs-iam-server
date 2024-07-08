import { DomainError } from '../../../shared/error/index.js';

export class AuthenticationDomainError extends DomainError {
    public constructor(
        public override readonly message: string,
        public readonly entityId: string | undefined,
        details?: unknown[] | Record<string, undefined>,
    ) {
        super(message, 'USER_COULD_NOT_BE_AUTHENTICATED', details);
    }
}
