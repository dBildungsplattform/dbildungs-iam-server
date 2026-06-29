import { ServiceProviderError } from '../../specification/error/service-provider.error.js';

export class VidisServiceProviderImmutableError extends ServiceProviderError {
    public constructor(message: string, entityId?: string, details?: unknown[] | Record<string, undefined>) {
        super(message, 'VIDIS_SERVICE_PROVIDER_IMMUTABLE', entityId, details);
    }
}
