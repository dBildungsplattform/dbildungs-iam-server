import { PersonenkontexteUpdateError } from './personenkontexte-update.error.js';
import { UpdateInvalidRollenartForLernError } from './update-invalid-rollenart-for-lern.error.js';

describe('UpdateInvalidRollenartForLernError', () => {
    it('should create an instance of UpdateInvalidRollenartForLernError', () => {
        const error: UpdateInvalidRollenartForLernError = new UpdateInvalidRollenartForLernError();

        expect(error).toBeInstanceOf(UpdateInvalidRollenartForLernError);
        expect(error).toBeInstanceOf(PersonenkontexteUpdateError);
    });

    it('should have the correct error message', () => {
        const error: UpdateInvalidRollenartForLernError = new UpdateInvalidRollenartForLernError();

        expect(error.message).toBe(
            'Personenkontexte could not be updated because the sent one of the sent rollen is invalid for the person with rollenart LERN!',
        );
    });

    it('should handle no details gracefully', () => {
        const error: UpdateInvalidRollenartForLernError = new UpdateInvalidRollenartForLernError();

        expect(error.details).toBeUndefined();
    });
});
