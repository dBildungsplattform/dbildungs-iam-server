import { DuplicatePersonalnummerError } from './duplicate-personalnummer.error.js';

describe('EntityCouldNotBeCreated', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: DuplicatePersonalnummerError = new DuplicatePersonalnummerError('EntityName');
                expect(error.code).toBe('PERSONALNUMMER_ALREADY_EXISTS');
            });
        });
    });
});
