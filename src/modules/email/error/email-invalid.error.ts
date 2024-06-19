import { DomainError } from '../../../shared/error/index.js';

export class EmailInvalidError extends DomainError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super('Email is invalid', 'ENTITY_COULD_NOT_BE_UPDATED', details);
    }
}
