import { SchuleZugehoerigZuTraegerError } from './schule-zugehoerig-zu-traeger.error.js';

describe('SchuleZugehoerigZuTraegerSpecificationError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: SchuleZugehoerigZuTraegerError = new SchuleZugehoerigZuTraegerError('1', {});
                expect(error.message).toBe(
                    'Organisation with ID 1 could not be updated because it violates SchuleZugehoerigZuTraeger specification',
                );
                expect(error.code).toBe('ENTITY_COULD_NOT_BE_UPDATED');
            });
        });
    });
});
