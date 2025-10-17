import { PersonenkontexteUpdateError } from './personenkontexte-update.error.js';
import { DuplicateKlassenkontextError } from './update-invalid-duplicate-klassenkontext-for-same-rolle.js';

describe('DuplicateKlassenkontextError', () => {
    it('should create an instance of DuplicateKlassenkontextError', () => {
        const error: DuplicateKlassenkontextError = new DuplicateKlassenkontextError();

        expect(error).toBeInstanceOf(DuplicateKlassenkontextError);
        expect(error).toBeInstanceOf(PersonenkontexteUpdateError);
    });

    it('should have the correct error message', () => {
        const error: DuplicateKlassenkontextError = new DuplicateKlassenkontextError();

        expect(error.message).toBe('Person already has a Klassenkontext with this Rolle under this Organisation');
    });
});
