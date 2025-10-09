import { OxError } from '../../../../shared/error/ox.error';

export class OxGroupNameAmbiguousError extends OxError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'OX_GROUP_NAME_AMBIGUOUS_ERROR', details);
    }
}
