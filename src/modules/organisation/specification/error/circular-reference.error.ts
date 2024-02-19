import { DomainError } from '../../../../shared/error/index.js';

export class CircularReferenceError extends DomainError {
    public constructor(entityId: string, specification: string, details?: unknown[] | Record<string, undefined>) {
        super(
            `Organisation with ID ${entityId} could not be updated because it does not satisfy specification ${specification}`,
            'ENTITY_COULD_NOT_BE_UPDATED',
            details,
        );
    }
}
