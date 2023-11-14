import { DomainError } from './domain.error.js';

export class EntityCouldNotBeUpdated extends DomainError {
    public constructor(entityName: string, entityId: string, details?: unknown[] | Record<string, undefined>) {
        super(`${entityName} with ID ${entityId} could not be updated`, 'ENTITY_COULD_NOT_BE_UPDATED', details);
    }
}
