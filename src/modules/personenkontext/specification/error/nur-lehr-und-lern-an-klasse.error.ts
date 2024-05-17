import { DomainError } from '../../../../shared/error/index.js';

export class NurLehrUndLernAnKlasseError extends DomainError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            `Personenkontext could not be created because it violates NurLehrUndLernAnKlasse specification`,
            'ENTITY_COULD_NOT_BE_CREATED',
            details,
        );
    }
}
