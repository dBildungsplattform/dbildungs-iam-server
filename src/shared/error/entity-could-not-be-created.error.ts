import { DomainError } from './domain.error.js';

export class EntityCouldNotBeCreated extends DomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'ENTITY_CLOUD_NOT_BE_CREATED', details);
    }
}
