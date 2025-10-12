import { PersonenkontexteUpdateError } from './personenkontexte-update.error.js';

export class DuplicateKlassenkontextError extends PersonenkontexteUpdateError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(`User already has a Klassenkontext with this Rolle under this Organisation`, details);
    }
}
