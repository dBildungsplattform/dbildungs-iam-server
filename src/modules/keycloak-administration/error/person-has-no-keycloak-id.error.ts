import { DomainError } from '../../../shared/error/domain.error.js';

export class PersonHasNoKeycloakId extends DomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(`The person with ID: ${message} has no KeycloakUserId`, 'PERSON_HAS_NO_KEYCLOAK_ID', details);
    }
}
