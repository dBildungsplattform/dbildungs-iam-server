import { MappingError, mappingErrorHandler } from './mapping.error.js';

describe('MappingError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const error: MappingError = new MappingError('No mapping provided');
                expect(error.message).toBe('No mapping provided');
                expect(error.code).toBe('MAPPING_ERROR');
            });
        });
    });

    describe('mappingErrorHandler', () => {
        describe('when calling the handler', () => {
            it('should throw a mapping error', () => {
                expect(() => mappingErrorHandler.handle(new Error())).toThrowError(MappingError);
            });
        });
    });
});
