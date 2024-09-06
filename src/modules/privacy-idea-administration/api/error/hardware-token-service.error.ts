import { TokenError } from './token.error.js';

export class HardwareTokenServiceError extends TokenError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(
            'Leider konnte ihr Hardware-Token aus technischen Gründen nicht aktiviert werden. Bitte versuchen Sie es zu einem späteren Zeitpunkt erneut. Falls das Problem bestehen bleibt, stellen Sie bitte eine Anfrage über den IQSH Helpdesk.--Link: https://www.secure-lernnetz.de/helpdesk/',
            undefined,
            details,
        );
    }
}
