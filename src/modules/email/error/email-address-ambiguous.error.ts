import { DomainError } from '../../../shared/error/index.js';

export class EmailAddressAmbiguousError extends DomainError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super('Email-address is ambiguous for person', 'ENTITY_NOT_FOUND', details);
    }
}
