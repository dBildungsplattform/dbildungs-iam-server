import { DomainError } from '../../../shared/error/domain.error.js';

export class MeldungInhaltError extends DomainError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super('Content of Meldung is Invalid', 'MELDUNG_INHALT_INVALID', details);
    }
}
