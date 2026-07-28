import { DomainError } from '../../../shared/error/index.js';
import { MultiDomainError } from '../../../shared/error/multidomain.error.js';

export class ApplyRollenerweiterungServiceProvidersError extends MultiDomainError {
    public constructor(
        errors: {
            serviceProviderId: string;
            error: DomainError;
        }[],
    ) {
        super(
            errors.map((e: { serviceProviderId: string; error: DomainError }) => ({
                id: e.serviceProviderId,
                error: e.error,
            })),
            `${errors.length} errors occured while applying rollenerweiterungen`,
        );
    }
}
