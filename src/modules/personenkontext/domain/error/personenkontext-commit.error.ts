import { DomainError } from '../../../../shared/error/index.js';

export class PersonenkontextCommitError extends DomainError {
    public constructor(
        public override readonly message: string,
        details?: unknown[] | Record<string, undefined>,
    ) {
        super(message, 'PERSONENKONTEXT_COULD_NOT_BE_COMMITED', details);
    }
}
