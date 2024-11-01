import { DomainError } from './domain.error.js';

export class MissingPermissionsError extends DomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'MISSING_PERMISSIONS', details);
    }
}
