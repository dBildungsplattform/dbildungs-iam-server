import { KennungRequiredForSchuleError } from './kennung-required-for-schule.error.js';

describe('KennungRequiredForSchuleError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: KennungRequiredForSchuleError = new KennungRequiredForSchuleError({});
                expect(error.message).toBe('Schule could not be created/updated because kennung is required');
                expect(error.code).toBe('ENTITY_COULD_NOT_BE_UPDATED');
            });
        });
    });
});
