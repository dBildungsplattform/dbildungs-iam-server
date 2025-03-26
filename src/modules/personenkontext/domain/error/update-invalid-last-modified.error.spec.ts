import { PersonenkontexteUpdateError } from './personenkontexte-update.error.js';
import { UpdateInvalidLastModifiedError } from './update-invalid-last-modified.error.js';

describe('UpdateInvalidLastModified', () => {
    it('should create an instance of UpdateInvalidLastModifiedError', () => {
        const error: UpdateInvalidLastModifiedError = new UpdateInvalidLastModifiedError();

        expect(error).toBeInstanceOf(UpdateInvalidLastModifiedError);
        expect(error).toBeInstanceOf(PersonenkontexteUpdateError);
    });

    it('should have the correct error message', () => {
        const error: UpdateInvalidLastModifiedError = new UpdateInvalidLastModifiedError();

        expect(error.message).toBe(
            'Personenkontexte could not be updated because the sent lastModified value is invalid!',
        );
    });

    it('should handle no details gracefully', () => {
        const error: UpdateInvalidLastModifiedError = new UpdateInvalidLastModifiedError();

        expect(error.details).toBeUndefined();
    });
});
