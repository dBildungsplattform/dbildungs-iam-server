import { SharedDomainError } from './index.js';

export class InvalidCharacterSetError extends SharedDomainError {
    public constructor(field: string, characterSet: string, details?: unknown[] | Record<string, unknown>) {
        super(`Field ${field} has wrong character set. Expected ${characterSet}`, 'INVALID_CHARACTER_SET', details);
    }
}
