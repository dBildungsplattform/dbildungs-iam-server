import { KeycloakUserNotFoundError } from './keycloak-user-not-found.error.js';

describe('KeycloakUserNotFoundError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: KeycloakUserNotFoundError = new KeycloakUserNotFoundError({});
                expect(error.message).toBe('The Keycloak User does not exist.');
                expect(error.code).toBe('USER_COULD_NOT_BE_AUTHENTICATED');
            });
        });
    });
});
