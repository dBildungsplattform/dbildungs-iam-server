import { DomainError } from './domain.error.js';

export class EntityNotFoundError extends DomainError {
    public constructor(
        entityName: string = 'entity',
        id: string = 'ID',
        details?: unknown[] | Record<string, unknown>,
    ) {
        super(`requested ${entityName} with the following ${id} was not found`, 'ENTITY_NOT_FOUND', details);
    }
}
