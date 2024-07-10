import { AuthenticationDomainError } from './authentication-domain.error.js';

export class KeycloakUserNotFoundError extends AuthenticationDomainError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super('The Keycloak User does not exist.', undefined, details);
    }
}
