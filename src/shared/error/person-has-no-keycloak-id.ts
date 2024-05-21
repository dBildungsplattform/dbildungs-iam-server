import { DomainError } from './domain.error.js';

export class PersonHasNoKeycloakId extends DomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(`The person with ID: ${message} has no KeycloakUserId`, 'INVALID_NAME_ERROR', details);
    }
}
