import { TokenError } from './token.error.js';

export class TokenResetError extends TokenError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            'Leider konnten wir Ihren Token aufgrund von technischen Problemen nicht zurücksetzen. Bitte versuchen Sie es zu einem späteren Zeitpunkt erneut. Falls das Problem bestehen bleibt, stellen Sie bitte eine Anfrage über den IQSH Helpdesk.  Link: https://www.secure-lernnetz.de/helpdesk/',
            undefined,
            details,
        );
    }
}
