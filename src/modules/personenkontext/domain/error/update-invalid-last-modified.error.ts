import { PersonenkontexteUpdateError } from './personenkontexte-update.error.js';

export class UpdateInvalidLastModifiedError extends PersonenkontexteUpdateError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(`Personenkontexte could not be updated because the sent lastModified value is invalid!`, details);
    }
}
