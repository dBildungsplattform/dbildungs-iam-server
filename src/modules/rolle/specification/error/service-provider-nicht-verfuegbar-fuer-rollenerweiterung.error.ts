import { RolleDomainError } from '../../domain/rolle-domain.error.js';

export class ServiceProviderNichtVerfuegbarFuerRollenerweiterungError extends RolleDomainError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            'The Rollenerweiterung is not possible, because the ServiceProvider is not available for Rollenerweiterung.',
            undefined,
            details,
        );
    }
}
