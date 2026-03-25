import { SharedDomainError } from './index.js';

export class EntityAlreadyExistsError extends SharedDomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'ENTITY_ALREADY_EXISTS', details);
    }
}
