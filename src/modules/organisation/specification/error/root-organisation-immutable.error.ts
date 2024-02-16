import { DomainError } from '../../../../shared/error/index.js';

export class RootOrganisationImmutableError extends DomainError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super('The root organisation cannot be altered!', 'ENTITY_COULD_NOT_BE_UPDATED', details);
    }
}
