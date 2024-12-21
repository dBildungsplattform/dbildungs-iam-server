import { ImportDomainError } from './import-domain.error.js';

export class ImportResultMaxUsersError extends ImportDomainError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            `Import result could not be returned because the limit exceeds the maximum allowed number of users per request`,
            undefined,
            details,
        );
    }
}
