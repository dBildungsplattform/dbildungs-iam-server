import { DomainError } from '../../../shared/error/index.js';

export class UsernameRequiredError extends DomainError {
    public constructor(
        public override readonly message: string,
        details?: unknown[] | Record<string, undefined>,
    ) {
        super(message, 'ENTITY_COULD_NOT_BE_UPDATED', details);
    }
}
