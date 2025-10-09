import { OxError } from '../../../../shared/error/ox.error';

export class OxUsernameAlreadyExistsError extends OxError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'OX_USERNAME_ALREADY_EXISTS_ERROR', details);
    }
}
