import { DomainError } from '../../../shared/error/index.js';
import { MultiDomainError } from '../../../shared/error/multidomain.error.js';

export class ApplyRollenerweiterungError extends MultiDomainError {
    public constructor(
        errors: {
            id: string;
            error: DomainError;
        }[],
    ) {
        super(
            errors.map((e: { id: string; error: DomainError }) => ({ id: e.id, error: e.error })),
            `${errors.length} errors occured while applying rollenerweiterungen`,
        );
    }
}
