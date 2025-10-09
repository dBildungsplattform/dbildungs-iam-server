import { DomainError } from '../../../../shared/error/index.js';

export class EmailAddressGenerationAttemptsExceededError extends DomainError {
    public constructor(address: string = 'address_not_provided', details?: unknown[] | Record<string, unknown>) {
        super(
            `Max attempts to generate email-address exceeded for address:${address}`,
            'EMAIL_ADDRESS_GENERATION_ERROR',
            details,
        );
    }
}
