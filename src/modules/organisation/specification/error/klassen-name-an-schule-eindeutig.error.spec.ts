import { KlassenNameAnSchuleEindeutigError } from './klassen-name-an-schule-eindeutig.error.js';
import { OrganisationSpecificationErrorI18nTypes } from '../../api/dbiam-organisation.error.js';

describe('KlassenNameAnSchuleEindeutigSpecificationError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: KlassenNameAnSchuleEindeutigError = new KlassenNameAnSchuleEindeutigError('1', {});
                expect(error.message).toBe(
                    `Organisation with ID 1 could not be updated because it violates ${OrganisationSpecificationErrorI18nTypes.KLASSENNAME_AN_SCHULE_EINDEUTIG} specification`,
                );
                expect(error.code).toBe('ENTITY_COULD_NOT_BE_UPDATED');
            });
        });
    });
});
