import { SchuleKennungEindeutigError } from './schule-kennung-eindeutig.error.js';
import { OrganisationSpecificationErrorI18nTypes } from '../../api/dbiam-organisation.error.js';

describe('SchuleKennungEindeutigError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: SchuleKennungEindeutigError = new SchuleKennungEindeutigError(undefined);
                expect(error.message).toBe(
                    `Organisation with ID undefined could not be updated because it violates ${OrganisationSpecificationErrorI18nTypes.SCHULE_KENNUNG_EINDEUTIG} specification`,
                );
                expect(error.code).toBe('ENTITY_COULD_NOT_BE_UPDATED');
            });
        });
    });
});
