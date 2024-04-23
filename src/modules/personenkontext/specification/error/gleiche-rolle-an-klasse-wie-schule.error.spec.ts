import { GleicheRolleAnKlasseWieSchuleError } from './gleiche-rolle-an-klasse-wie-schule.error.js';

describe('GleicheRolleAnKlasseWieSchuleError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: GleicheRolleAnKlasseWieSchuleError = new GleicheRolleAnKlasseWieSchuleError({});
                expect(error.message).toBe(
                    'Personenkontext could not be created because it violates GleicheRolleAnKlasseWieSchule specification',
                );
                expect(error.code).toBe('ENTITY_COULD_NOT_BE_CREATED');
            });
        });
    });
});
