import { PersonenkontextSpecificationError } from './personenkontext-specification.error.js';

export class UpdateOutdatedError extends PersonenkontextSpecificationError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(`Personenkontexte could not be updated because newer versions of personenkontexte exist.`, details);
    }
}
