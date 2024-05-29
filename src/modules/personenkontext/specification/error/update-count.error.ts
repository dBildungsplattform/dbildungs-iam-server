import { PersonenkontextSpecificationError } from './personenkontext-specification.error.js';

export class UpdateCountError extends PersonenkontextSpecificationError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            `Personenkontexte could not be updated because current count and count of the request are not matching`,
            details,
        );
    }
}
