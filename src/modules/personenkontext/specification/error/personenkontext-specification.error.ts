import { DomainError } from '../../../../shared/error/index.js';

export class PersonenkontextSpecificationError extends DomainError {
    public constructor(
        public override readonly message: string,
        details?: unknown[] | Record<string, undefined>,
    ) {
        super(message, 'ENTITY_COULD_NOT_BE_CREATED', details);
    }
}
