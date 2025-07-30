import { OxError } from '../../../shared/error/ox.error.js';

export class OxNoSuchUserError extends OxError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'OX_NO_SUCH_USER_ERROR', details);
    }
}
