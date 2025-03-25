import { DomainError } from '../../../../shared/error/index.js';

export class UnknownSubtreeError extends DomainError {
    public constructor(entityId: string, details?: unknown[] | Record<string, undefined>) {
        super(
            `Organisation with ID ${entityId} could not be updated because its subtree is unknown`,
            entityId,
            details,
        );
    }
}
