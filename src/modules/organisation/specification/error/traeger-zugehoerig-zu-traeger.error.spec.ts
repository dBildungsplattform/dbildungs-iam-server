import { TraegerZugehoerigZuTraegerError } from './traeger-zugehoerig-zu-traeger.error.js';

describe('TraegerZugehoerigZuTraegerSpecificationError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: TraegerZugehoerigZuTraegerError = new TraegerZugehoerigZuTraegerError('1', {});
                expect(error.message).toBe(
                    'Organisation with ID 1 could not be updated because it violates TraegerZugehoerigZuTraeger specification',
                );
                expect(error.code).toBe('ENTITY_COULD_NOT_BE_UPDATED');
            });
        });
    });
});
