import { DomainError } from './domain.error.js';

export abstract class MultiDomainError extends DomainError {
    public readonly errors: {
        id: string | undefined;
        error: DomainError;
    }[];

    public constructor(
        errors: {
            id: string | undefined;
            error: DomainError;
        }[],
        message: string = 'Multiple errors occurred',
    ) {
        super(message, 'MULTI_DOMAIN_ERROR');
        this.errors = errors;
    }
}
