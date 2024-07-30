import { NameRequiredForKlasseError } from './name-required-for-klasse.error.js';

describe('NameRequiredForKlasseError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: NameRequiredForKlasseError = new NameRequiredForKlasseError({});
                expect(error.message).toBe('Klasse could not be created/updated because name is required');
                expect(error.code).toBe('ENTITY_COULD_NOT_BE_UPDATED');
            });
        });
    });
});
