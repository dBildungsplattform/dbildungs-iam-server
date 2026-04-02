import { ServiceProviderError } from '../../specification/error/service-provider.error';

export class AttachedRollenerweiterungenError extends ServiceProviderError {
    public constructor(message: string, entityId?: string, details?: unknown[] | Record<string, undefined>) {
        super(message, 'ATTACHED_ROLLENERWEITERUNGEN', entityId, details);
    }
}
