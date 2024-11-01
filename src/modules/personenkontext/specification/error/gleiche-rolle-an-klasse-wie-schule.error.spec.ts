import { GleicheRolleAnKlasseWieSchuleError } from './gleiche-rolle-an-klasse-wie-schule.error.js';
import { PersonenkontextSpecificationErrorI18nTypes } from '../../api/dbiam-personenkontext.error.js';

describe('GleicheRolleAnKlasseWieSchuleError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: GleicheRolleAnKlasseWieSchuleError = new GleicheRolleAnKlasseWieSchuleError({});
                expect(error.message).toBe(
                    `Personenkontext could not be created/updates because it violates ${PersonenkontextSpecificationErrorI18nTypes.GLEICHE_ROLLE_AN_KLASSE_WIE_SCHULE} specification`,
                );
                expect(error.code).toBe('ENTITY_COULD_NOT_BE_CREATED');
            });
        });
    });
});
