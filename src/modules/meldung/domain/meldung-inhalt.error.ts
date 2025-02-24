import { MeldungDomainError } from './meldung-domain.error.js';

export class MeldungInhaltError extends MeldungDomainError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super('Content of Meldung is Invalid', 'MELDUNG_INHALT_INVALID', details);
    }
}
