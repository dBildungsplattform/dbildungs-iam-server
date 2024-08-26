import { PersonenkontexteUpdateError } from './personenkontexte-update.error.js';

export class PersonenkontextBefristungRequiredError extends PersonenkontexteUpdateError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(`Personenkontexte could not be saved because the Befristung is missing for at least 1 Kontext!`, details);
    }
}
