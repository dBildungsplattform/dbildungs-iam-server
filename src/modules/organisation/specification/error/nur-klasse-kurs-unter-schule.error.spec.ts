import { NurKlasseKursUnterSchuleError } from './nur-klasse-kurs-unter-schule.error.js';
import { OrganisationSpecificationErrorI18nTypes } from '../../api/dbiam-organisation.error.js';

describe('NurKlasseKursUnterSchuleSpecificationError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: NurKlasseKursUnterSchuleError = new NurKlasseKursUnterSchuleError('1', {});
                expect(error.message).toBe(
                    `Organisation with ID 1 could not be updated because it violates ${OrganisationSpecificationErrorI18nTypes.NUR_KLASSE_UNTER_SCHULE} specification`,
                );
                expect(error.code).toBe('ENTITY_COULD_NOT_BE_UPDATED');
            });
        });
    });
});
