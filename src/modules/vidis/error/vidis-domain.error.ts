import { DomainError } from '../../../shared/error/index.js';

export class VidisDomainError extends DomainError {
    public constructor(
        public override readonly message: string,
        details?: unknown[] | Record<string, undefined>,
    ) {
        super(message, 'VIDIS_ERROR', details);
    }
}
