import { DomainError } from '../../../../shared/error/index.js';

export class TraegerInTraegerError extends DomainError {
    public constructor(entityId: string, details?: unknown[] | Record<string, undefined>) {
        super(
            `Organisation with ID ${entityId} could not be updated because it violates TraegerInTraeger specification`,
            'ENTITY_COULD_NOT_BE_UPDATED',
            details,
        );
    }
}
