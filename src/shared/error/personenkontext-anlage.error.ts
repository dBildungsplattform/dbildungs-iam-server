import { DomainError } from './domain.error.js';

export class PersonenkontextAnlageError extends DomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'PERSONEN_KONTEXT_ANLAGE_INVALID', details);
    }
}
