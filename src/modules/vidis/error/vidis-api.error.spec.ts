import { faker } from '@faker-js/faker';

import { VidisApiError } from './vidis-api.error.js';

describe('VidisApiError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const message: string = faker.lorem.sentence();
                const error: VidisApiError = new VidisApiError(message);

                expect(error.message).toBe(message);
                expect(error.code).toBe('VIDIS_ERROR');
            });

            it('should set default message and code when no message is provided', () => {
                const error: VidisApiError = new VidisApiError();

                expect(error.message).toBe('Vidis Api Returned Error');
                expect(error.code).toBe('VIDIS_ERROR');
            });
        });
    });
});