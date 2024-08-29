import { PersonenkontexteUpdateError } from './personenkontexte-update.error.js';

export class UpdateInvalidRollenartForLernError extends PersonenkontexteUpdateError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            `Personenkontexte could not be updated because the sent one of the sent rollen is invalid for the person with rollenart LERN!`,
            details,
        );
    }
}
