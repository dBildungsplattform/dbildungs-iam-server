import { DomainError } from './domain.error.js';

export class InvalidAttributeLengthError extends DomainError {
    public constructor(attribute: string, details?: unknown[] | Record<string, unknown>) {
        super(`the attribute ${attribute} has an invalid length`, 'INVALID_ATTRIBUTE_LENGTH_ERROR', details);
    }
}
