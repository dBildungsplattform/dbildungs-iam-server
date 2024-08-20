import { UpdateOutdatedError } from './update-outdated.error.js';

describe('UpdateOutdatedError', () => {
    it('should create an instance of UpdateOutdatedError', () => {
        const error: UpdateOutdatedError = new UpdateOutdatedError();

        expect(error).toBeInstanceOf(UpdateOutdatedError);
        expect(error).toBeInstanceOf(UpdateOutdatedError);
    });

    it('should have the correct error message', () => {
        const error: UpdateOutdatedError = new UpdateOutdatedError();

        expect(error.message).toBe(
            'Personenkontexte could not be updated because newer versions of personenkontexte exist.',
        );
    });

    it('should handle no details gracefully', () => {
        const error: UpdateOutdatedError = new UpdateOutdatedError();

        expect(error.details).toBeUndefined();
    });
});
