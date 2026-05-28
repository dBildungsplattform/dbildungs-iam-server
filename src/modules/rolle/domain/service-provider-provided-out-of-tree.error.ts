import { RolleDomainError } from './rolle-domain.error.js';

export class ServiceProviderProvidedOutOfTreeError extends RolleDomainError {
    public constructor(serviceProviderId: string, details?: unknown[] | Record<string, undefined>) {
        super(
            `Rolle could not be updated because the service provider ${serviceProviderId} is not provided on the rolle's organisation or one of its parents`,
            undefined,
            details,
        );
    }
}
