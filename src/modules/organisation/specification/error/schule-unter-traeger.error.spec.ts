import { SchuleUnterTraegerError } from './schule-unter-traeger.error.js';
import { OrganisationSpecificationErrorI18nTypes } from '../../api/dbiam-organisation.error.js';

describe('SchuleUnterTraegerSpecificationError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: SchuleUnterTraegerError = new SchuleUnterTraegerError('1', {});
                expect(error.message).toBe(
                    `Organisation with ID 1 could not be updated because it violates ${OrganisationSpecificationErrorI18nTypes.SCHULE_UNTER_TRAEGER} specification`,
                );
                expect(error.code).toBe('ENTITY_COULD_NOT_BE_UPDATED');
            });
        });
    });
});
