import { PersonenkontextBefristungRequiredError } from './personenkontext-befristung-required.error.js';

describe('PersonenkontextBefristungRequiredError', () => {
    it('should create an error with the correct message and code', () => {
        const error: PersonenkontextBefristungRequiredError = new PersonenkontextBefristungRequiredError();

        expect(error).toBeInstanceOf(PersonenkontextBefristungRequiredError);
        expect(error.details).toBeUndefined();
    });
});
