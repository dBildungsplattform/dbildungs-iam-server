import { RolleDomainError } from '../../domain/rolle-domain.error.js';

export class ServiceProviderNichtNachtraeglichZuweisbarError extends RolleDomainError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            'The ServiceProviders for the Rolle cannot be updated, because one or more ServiceProviders can not be assigned after Rolle creation.',
            undefined,
            details,
        );
    }
}
