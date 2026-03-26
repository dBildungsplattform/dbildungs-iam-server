import { ServiceProviderError } from './service-provider.error.js';

export class DuplicateNameError extends ServiceProviderError {
    public constructor(message: string, entityId?: string, details?: unknown[] | Record<string, undefined>) {
        super(message, 'DUPLICATE_NAME', entityId, details);
    }
}
