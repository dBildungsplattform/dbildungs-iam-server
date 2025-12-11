import { PersonenkontexteUpdateError } from './personenkontexte-update.error.js';

export class UpdateLernNotAtSchuleAndKlasseError extends PersonenkontexteUpdateError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            `Personenkontext could not be created/updates because not every LERN-PK has a corresponding Schule or Klasse`,
            details,
        );
    }
}
