import { ServiceProviderError } from '../../specification/error/service-provider.error';

export class AttachedRollenError extends ServiceProviderError {
    public constructor(message: string, entityId?: string, details?: unknown[] | Record<string, undefined>) {
        super(message, 'ATTACHED_ROLLEN', entityId, details);
    }
}
