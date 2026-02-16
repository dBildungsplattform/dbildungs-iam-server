import { DomainError } from '../../../shared/error/index.js';

export class RollenerweiterungDomainError extends DomainError {
    public constructor(
        public override readonly message: string,
        public readonly entityId: string | undefined,
        details?: unknown[] | Record<string, undefined>,
    ) {
        super(message, 'ENTITY_COULD_NOT_BE_UPDATED', details);
    }
}
