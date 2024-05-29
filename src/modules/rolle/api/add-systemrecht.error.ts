import { RolleApiError } from './rolle-api.error.js';

export class AddSystemrechtError extends RolleApiError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super('Adding systemrecht to rolle failed.', undefined, details);
    }
}
