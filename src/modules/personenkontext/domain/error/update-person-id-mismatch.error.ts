import { PersonenkontexteUpdateError } from './personenkontexte-update.error.js';

export class UpdatePersonIdMismatchError extends PersonenkontexteUpdateError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            `Personenkontexte could not be updated because at least one Personenkontext has a non-matching personId.`,
            details,
        );
    }
}
