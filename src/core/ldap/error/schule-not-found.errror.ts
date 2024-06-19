import { DomainError } from '../../../shared/error/index.js';

export class SchuleNotFoundErrror extends DomainError {
    public constructor(ou: string = 'OU', details?: unknown[] | Record<string, unknown>) {
        super(`LDAP entity Schule with the following OU ${ou} was not found`, 'ENTITY_NOT_FOUND', details);
    }
}
