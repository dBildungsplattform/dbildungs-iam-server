import { DomainError } from '../../../shared/error/index.js';

export class LandesbediensteterSearchError extends DomainError {
    public constructor(
        public override readonly message: string,
        public readonly entityId: string | undefined,
        details?: unknown[] | Record<string, undefined>,
    ) {
        super(message, 'LANDESBEDIENSTETER_SEARCH', details);
    }
}
