import { DomainError } from './domain.error.js';

export class IdWasSentWithPayload extends DomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'ID_WAS_SENT_WITH_PAYLOAD', details);
    }
}
