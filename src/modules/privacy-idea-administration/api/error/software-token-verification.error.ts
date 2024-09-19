import { TokenError } from './token.error.js';

export class SoftwareTokenVerificationError extends TokenError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super('Fehler bei der Verifizierung des Softwaretokens', undefined, details);
    }
}
