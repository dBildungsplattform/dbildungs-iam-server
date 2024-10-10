import { TokenError } from './token.error.js';

export class SerialInUseError extends TokenError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            'Die eingegebene Seriennummer wird bereits aktiv verwendet. Bitte überprüfen Sie ihre Eingabe und versuchen Sie es erneut.',
            undefined,
            details,
        );
    }
}
