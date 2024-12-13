import { PersonDomainError } from './person-domain.error.js';

export class PersonUserPasswordModificationError extends PersonDomainError {
    public constructor(entityId: string | undefined, details?: unknown[] | Record<string, undefined>) {
        super(`Attribute 'userPassword' (UEM) could not be modified for Person with id ${entityId}`, entityId, details);
    }
}
