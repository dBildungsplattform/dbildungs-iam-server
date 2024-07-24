import { PersonenkontexteUpdateError } from './personenkontexte-update.error.js';

export class UpdatePersonNotFoundError extends PersonenkontexteUpdateError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(`Personenkontexte could not be updated because the person has been deleted.`, details);
    }
}
