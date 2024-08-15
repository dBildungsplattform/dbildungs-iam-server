import { TokenError } from './token.error.js';

export class SerialNotFoundError extends TokenError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            'Die eingegebene Seriennummer konnte leider nicht gefunden werden. Vergewissern Sie sich bitte, das Sie eine korrekte Seriennummer eingegeben haben.',
            undefined,
            details,
        );
    }
}
