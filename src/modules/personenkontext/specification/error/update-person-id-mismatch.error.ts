import { PersonenkontextSpecificationError } from './personenkontext-specification.error.js';

export class UpdatePersonIdMismatchError extends PersonenkontextSpecificationError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            `Personenkontexte could not be updated because at least one Personenkontext has a non-matching personId.`,
            details,
        );
    }
}
