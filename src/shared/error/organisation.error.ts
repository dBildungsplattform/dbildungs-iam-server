import { DomainError } from './domain.error.js';

export class OrganisationError extends DomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'ORGANISATION_ERROR', details);
    }
}
