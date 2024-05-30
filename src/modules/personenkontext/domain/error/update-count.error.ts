import { PersonenkontexteUpdateError } from './personenkontexte-update.error.js';

export class UpdateCountError extends PersonenkontexteUpdateError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            `Personenkontexte could not be updated because current count and count of the request are not matching`,
            details,
        );
    }
}
