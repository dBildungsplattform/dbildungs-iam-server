import { TokenError } from './token.error.js';

export class TwoAuthStateError extends TokenError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super('Error getting two-factor auth state.', undefined, details);
    }
}
