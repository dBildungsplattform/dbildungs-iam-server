import { KeycloakClientError } from './keycloak-client.error.js';

describe('KeycloakClientError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: KeycloakClientError = new KeycloakClientError('Something went wrong');
                expect(error.message).toBe('Something went wrong');
                expect(error.code).toBe('KEYCLOAK_CLIENT_ERROR');
            });
        });
    });
});
