import { DomainError } from '../../../../shared/error/index.js';

export class KennungRequiredForSchuleError extends DomainError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            `Schule could not be created/updated because it kennung is required`,
            'ENTITY_COULD_NOT_BE_UPDATED',
            details,
        );
    }
}
