import { DomainError } from './domain.error.js';

export class ServiceProviderError extends DomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'SERVICE_PROVIDER_ERROR', details);
    }
}
