import { SharedDomainError } from './index.js';

export class InvalidAttributeLengthError extends SharedDomainError {
    public constructor(attribute: string, details?: unknown[] | Record<string, unknown>) {
        super(`the attribute ${attribute} has an invalid length`, 'INVALID_ATTRIBUTE_LENGTH_ERROR', details);
    }
}
