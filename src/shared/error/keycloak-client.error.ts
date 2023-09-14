import { DomainError } from './domain.error.js';

export class KeycloakClientError extends DomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'KEYCLOAK_CLIENT_ERROR', details);
    }
}
