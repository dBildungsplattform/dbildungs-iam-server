import { DomainError } from './domain.error.js';

export class RoleAssignmentError extends DomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'ROLE_ASSIGNMENT_NOT_ALLOWED', details);
    }
}
