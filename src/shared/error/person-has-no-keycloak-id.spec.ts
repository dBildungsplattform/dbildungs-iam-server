import { PersonHasNoKeycloakId } from './person-has-no-keycloak-id.js';

describe('PersonHasNoKeycloakId', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: PersonHasNoKeycloakId = new PersonHasNoKeycloakId('1');
                expect(error.message).toBe('The person with ID: 1 has no KeycloakUserId');
                expect(error.code).toBe('PERSON_HAS_NO_KEYCLOAK_ID');
            });
        });
    });
});
