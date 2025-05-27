import { LandesbediensteterSearchError } from './landesbediensteter-search-domain.error.js';
export class LandesbediensteterSearchNoPersonFoundError extends LandesbediensteterSearchError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(`No person found for search criteria`, 'LANDESBEDIENSTETER_SEARCH', details);
    }
}
