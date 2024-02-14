import { TraegerZuTraegerError } from './traeger-zu-traeger.error.js';

describe('TraegerZuTraegerSpecificationError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: TraegerZuTraegerError = new TraegerZuTraegerError('1', 'Specification');
                expect(error.message).toBe(
                    'Organisation with ID 1 could not be updated because it does not satisfy specification Specification',
                );
                expect(error.code).toBe('ENTITY_COULD_NOT_BE_UPDATED');
            });
        });
    });
});
