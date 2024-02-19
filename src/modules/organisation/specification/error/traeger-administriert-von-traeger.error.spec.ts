import { TraegerAdministriertVonTraegerError } from './traeger-administriert-von-traeger.error.js';

describe('TraegerAdministriertVonTraegerSpecificationError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: TraegerAdministriertVonTraegerError = new TraegerAdministriertVonTraegerError('1', {});
                expect(error.message).toBe(
                    'Organisation with ID 1 could not be updated because it violates TraegerAdministriertVonTraeger specification',
                );
                expect(error.code).toBe('ENTITY_COULD_NOT_BE_UPDATED');
            });
        });
    });
});
