import { ImportDomainError } from './import-domain.error.js';

export class ImportTextFileNotFoundError extends ImportDomainError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            `Text File for the import result could not be found, the importvorgangId might be wrong`,
            undefined,
            details,
        );
    }
}
