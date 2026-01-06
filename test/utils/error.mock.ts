import { DomainError } from '../../src/shared/error';

export class DomainErrorMock extends DomainError {
    public constructor(message?: string) {
        super(message ?? 'domain error mock message', 'DOMAIN_ERROR_MOCK');
    }
}
