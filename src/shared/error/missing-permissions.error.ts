import { SharedDomainError } from './index.js';

export class MissingPermissionsError extends SharedDomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'MISSING_PERMISSIONS', details);
    }
}
