import { RolleDomainError } from '../../domain/rolle-domain.error.js';

export class NoRedundantRollenerweiterungError extends RolleDomainError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            'The Rollenerweiterung is not possible, because the Rolle already has access to the ServiceProvider.',
            undefined,
            details,
        );
    }
}
