import { DomainError } from '../../../../shared/error/domain.error.js';

export class EmailDomainNotFoundError extends DomainError {
    public constructor(domain: string = 'domain', details?: unknown[] | Record<string, unknown>) {
        super(`requested EmailDomain with the domain:${domain} was not found`, 'ENTITY_NOT_FOUND', details);
    }
}
