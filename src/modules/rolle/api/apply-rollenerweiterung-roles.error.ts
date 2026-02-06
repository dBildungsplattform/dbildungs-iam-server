import { DomainError } from '../../../shared/error/index.js';
import { MultiDomainError } from '../../../shared/error/multidomain.error.js';

export class ApplyRollenerweiterungRolesError extends MultiDomainError {
    public constructor(
        errors: {
            rolleId: string;
            error: DomainError;
        }[],
    ) {
        super(
            errors.map((e: { rolleId: string; error: DomainError }) => ({ id: e.rolleId, error: e.error })),
            `${errors.length} errors occured while applying rollenerweiterungen`,
        );
    }
}
