import { PersonenkontexteUpdateError } from './personenkontexte-update.error.js';

export class PersonenkontextCommitError extends PersonenkontexteUpdateError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super('PERSONENKONTEXT_COULD_NOT_BE_COMMITED', details);
    }
}
