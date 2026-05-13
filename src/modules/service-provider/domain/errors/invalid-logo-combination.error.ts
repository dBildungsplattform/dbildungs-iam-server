import { ServiceProviderError } from '../../specification/error/service-provider.error.js';

export class InvalidLogoCombinationError extends ServiceProviderError {
    public constructor(message: string, entityId?: string, details?: unknown[] | Record<string, undefined>) {
        super(message, 'INVALID_LOGO_COMBINATION', entityId, details);
    }
}
