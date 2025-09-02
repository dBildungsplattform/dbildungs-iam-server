import { OxError } from '../../../shared/error/ox.error.js';

export class OxSyncError extends OxError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'OX_SYNC_ERROR', details);
    }
}
