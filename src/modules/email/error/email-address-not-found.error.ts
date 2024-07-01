import { DomainError } from '../../../shared/error/index.js';

export class EmailAddressNotFoundError extends DomainError {
    public constructor(address: string = 'address', details?: unknown[] | Record<string, unknown>) {
        super(`requested EmailAddress with the address:${address} was not found`, 'ENTITY_NOT_FOUND', details);
    }
}
