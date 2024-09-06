import { TokenError } from './token.error.js';

export class OTPnotValidError extends TokenError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super('Ungültiger Code. Bitte versuchen Sie es erneut.', undefined, details);
    }
}
