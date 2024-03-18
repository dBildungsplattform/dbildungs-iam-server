import { DomainError } from './domain.error.js';

export class InvalidCharacterSetError extends DomainError {
    public constructor(field: string, characterSet: string, details?: unknown[] | Record<string, unknown>) {
        super(`Field ${field} has wrong character set. Expected ${characterSet}`, 'INVALID_CHARACTER_SET', details);
    }
}
