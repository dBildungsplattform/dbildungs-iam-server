import { SchuleAdministriertVonTraegerError } from './schule-administriert-von-traeger.error.js';

describe('SchuleAdministriertVonTraegerSpecificationError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: SchuleAdministriertVonTraegerError = new SchuleAdministriertVonTraegerError('1', {});
                expect(error.message).toBe(
                    'Organisation with ID 1 could not be updated because it violates SchuleAdministriertVonTraeger specification',
                );
                expect(error.code).toBe('ENTITY_COULD_NOT_BE_UPDATED');
            });
        });
    });
});
