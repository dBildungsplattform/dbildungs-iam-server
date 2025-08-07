import { OxError } from '../../../shared/error/ox.error.js';

export class OxMemberAlreadyInGroupError extends OxError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'OX_MEMBER_ALREADY_IN_GROUP_ERROR', details);
    }
}
