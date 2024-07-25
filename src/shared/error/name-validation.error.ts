import { DomainError } from './domain.error.js';

export class NameValidationError extends DomainError {
    public constructor(fieldName: string, details?: unknown[] | Record<string, undefined>) {
        const message: string = `${fieldName} darf nicht mit einem Leerzeichen beginnen oder enden und darf nicht leer sein.`;
        super(message, message, details);
    }
}
