import { ImportDomainError } from './import-domain.error.js';

export class ImportCSVFileContainsNoUsersError extends ImportDomainError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(`CSV File is invalid because the file contains no users`, undefined, details);
    }
}
