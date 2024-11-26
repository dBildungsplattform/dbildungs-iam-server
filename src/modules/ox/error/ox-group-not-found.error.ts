import { OxError } from '../../../shared/error/ox.error.js';

export class OxGroupNotFoundError extends OxError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'OX_GROUP_NOT_FOUND_ERROR', details);
    }
}
