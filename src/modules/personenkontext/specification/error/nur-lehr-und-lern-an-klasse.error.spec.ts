import { NurLehrUndLernAnKlasseError } from './nur-lehr-und-lern-an-klasse.error.js';
import { PersonenkontextSpecificationErrorI18nTypes } from '../../api/dbiam-personenkontext.error.js';

describe('NurLehrUndLernAnKlasseError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: NurLehrUndLernAnKlasseError = new NurLehrUndLernAnKlasseError({});
                expect(error.message).toBe(
                    `Personenkontext could not be created/updates because it violates ${PersonenkontextSpecificationErrorI18nTypes.NUR_LEHR_UND_LERN_AN_KLASSE} specification`,
                );
                expect(error.code).toBe('ENTITY_COULD_NOT_BE_CREATED');
            });
        });
    });
});
