import { UpdatePersonNotFoundError } from './update-person-not-found.error.js';
import { PersonenkontexteUpdateError } from './personenkontexte-update.error.js';

describe('UpdatePersonNotFoundError', () => {
    it('should create an instance of UpdatePersonNotFoundError', () => {
        const error: UpdatePersonNotFoundError = new UpdatePersonNotFoundError();

        expect(error).toBeInstanceOf(UpdatePersonNotFoundError);
        expect(error).toBeInstanceOf(PersonenkontexteUpdateError);
    });

    it('should have the correct error message', () => {
        const error: UpdatePersonNotFoundError = new UpdatePersonNotFoundError();

        expect(error.message).toBe('Personenkontexte could not be updated because the person has been deleted.');
    });


    it('should handle no details gracefully', () => {
        const error: UpdatePersonNotFoundError = new UpdatePersonNotFoundError();

        expect(error.details).toBeUndefined();
    });
});
