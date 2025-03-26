import { ImportDomainError } from './import-domain.error.js';

export class ImportCSVFileMaxUsersError extends ImportDomainError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            `CSV File could not be parsed because the file exceeds the maximum allowed number of users`,
            undefined,
            details,
        );
    }
}
