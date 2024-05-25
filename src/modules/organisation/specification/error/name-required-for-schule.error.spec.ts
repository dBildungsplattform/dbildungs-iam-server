import { NameRequiredForSchuleError } from './name-required-for-schule.error.js';

describe('NameRequiredForSchuleError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: NameRequiredForSchuleError = new NameRequiredForSchuleError({});
                expect(error.message).toBe('Schule could not be created/updated because name is required');
                expect(error.code).toBe('ENTITY_COULD_NOT_BE_UPDATED');
            });
        });
    });
});
