import { LandesbediensteterSearchError } from './landesbediensteter-search-domain.error.js';

export class LandesbediensteterSearchMultiplePersonsFoundError extends LandesbediensteterSearchError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(`Multiple persons found for search criteria`, undefined, details);
    }
}
