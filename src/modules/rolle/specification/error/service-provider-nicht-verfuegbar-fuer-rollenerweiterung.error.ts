import { RolleDomainError } from '../../domain/rolle-domain.error.js';

export class ServiceProviderNichtVerfuegbarFuerRollenerweiterungError extends RolleDomainError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            'The Rolle cannot be updated, because one or more ServiceProviders are not available for RollenErweiterung.',
            undefined,
            details,
        );
    }
}
