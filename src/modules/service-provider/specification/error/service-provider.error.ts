import { DomainError } from '../../../../shared/error/domain.error.js';

export class ServiceProviderError extends DomainError {
    public constructor(
        public override readonly message: string,
        code: string,
        public readonly entityId?: string,
        details?: unknown[] | Record<string, undefined>,
    ) {
        super(message, code, details);
    }
}
