import { UpdatePersonIdMismatchError } from './update-person-id-mismatch.error.js';

describe('UpdatePersonIdMismatchError', () => {
    it('should create an instance of UpdatePersonIdMismatchError', () => {
        const error: UpdatePersonIdMismatchError = new UpdatePersonIdMismatchError();

        expect(error).toBeInstanceOf(UpdatePersonIdMismatchError);
        expect(error).toBeInstanceOf(UpdatePersonIdMismatchError);
    });

    it('should have the correct error message', () => {
        const error: UpdatePersonIdMismatchError = new UpdatePersonIdMismatchError();

        expect(error.message).toBe(
            'Personenkontexte could not be updated because at least one Personenkontext has a non-matching personId.',
        );
    });

    it('should handle no details gracefully', () => {
        const error: UpdatePersonIdMismatchError = new UpdatePersonIdMismatchError();

        expect(error.details).toBeUndefined();
    });
});
