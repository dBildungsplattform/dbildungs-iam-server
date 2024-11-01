import { DomainError } from './domain.error.js';

export class OxError extends DomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'OX_ERROR', details);
    }
}
