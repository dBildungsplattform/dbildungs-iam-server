import { PersonenkontexteUpdateError } from './personenkontexte-update.error.js';
import { UpdateLernNotAtSchuleAndKlasseError } from './update-lern-not-at-schule-and-klasse.error.js';

describe('UpdateLernNotAtSchuleAndKlasseError', () => {
    it('should create an instance of UpdateLernNotAtSchuleAndKlasseError', () => {
        const error: UpdateLernNotAtSchuleAndKlasseError = new UpdateLernNotAtSchuleAndKlasseError();

        expect(error).toBeInstanceOf(UpdateLernNotAtSchuleAndKlasseError);
        expect(error).toBeInstanceOf(PersonenkontexteUpdateError);
        expect(error.message).toBe(
            'Personenkontext could not be created/updated because not every LERN-PK has a corresponding Schule or Klasse',
        );
    });
});
