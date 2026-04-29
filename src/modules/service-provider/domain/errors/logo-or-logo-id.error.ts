import { ServiceProviderError } from '../../specification/error/service-provider.error.js';

export class LogoOrLogoIdError extends ServiceProviderError {
    public constructor(message: string, entityId?: string, details?: unknown[] | Record<string, undefined>) {
        super(message, 'LOGO_OR_LOGO_ID', entityId, details);
    }
}
