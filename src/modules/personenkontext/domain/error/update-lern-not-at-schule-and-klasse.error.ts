import { PersonenkontexteUpdateError } from './personenkontexte-update.error.js';

export class UpdateLernNotAtSchuleAndKlasseError extends PersonenkontexteUpdateError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            `Personenkontext could not be created/updated because not every LERN-PK has a corresponding Schule or Klasse`,
            details,
        );
    }
}
