import { DomainError } from './domain.error.js';

export class EntityCouldNotBeDeleted extends DomainError {
    public constructor(entityName: string, entityId: string, details?: unknown[] | Record<string, unknown>) {
        super(`${entityName} with ID ${entityId} could not be deleted`, 'ENTITY_COULD_NOT_BE_DELETED', details);
    }
}
