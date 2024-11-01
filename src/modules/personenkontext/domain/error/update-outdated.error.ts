import { PersonenkontexteUpdateError } from './personenkontexte-update.error.js';

export class UpdateOutdatedError extends PersonenkontexteUpdateError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(`Personenkontexte could not be updated because newer versions of personenkontexte exist.`, details);
    }
}
