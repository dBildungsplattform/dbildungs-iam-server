import { AuthenticationErrorI18nTypes } from '../../modules/authentication/api/dbiam-authentication.error.js';
import { HttpFoundException } from './http.found.exception.js';

describe('HttpFoundException', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const msg: Record<string, unknown> = {
                    DbiamAuthenticationError: {
                        code: 403,
                        i18nKey: AuthenticationErrorI18nTypes.KEYCLOAK_USER_NOT_FOUND,
                    },
                };
                const error: HttpFoundException = new HttpFoundException(msg);
                expect(error.getResponse()).toBe(msg);
                expect(error.getStatus()).toBe(302);
            });
        });
    });
});
