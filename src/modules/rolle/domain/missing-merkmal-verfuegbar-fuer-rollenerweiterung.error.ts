import { RollenerweiterungDomainError } from './rollenerweiterung-domain.error.js';

export class MissingMerkmalVerfuegbarFuerRollenerweiterungError extends RollenerweiterungDomainError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super('Merkmal VERFUEGBAR_FUER_ROLLENERWEITERUNG is missing', undefined, details);
    }
}
