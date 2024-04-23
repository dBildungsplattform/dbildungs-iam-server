import { NurLehrUndLernAnKlasseError } from './nur-lehr-und-lern-an-klasse.error.js';

describe('NurLehrUndLernAnKlasseError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: NurLehrUndLernAnKlasseError = new NurLehrUndLernAnKlasseError({});
                expect(error.message).toBe(
                    'Personenkontext could not be created because it violates NurLehrUndLernAnKlasse specification',
                );
                expect(error.code).toBe('ENTITY_COULD_NOT_BE_CREATED');
            });
        });
    });
});
