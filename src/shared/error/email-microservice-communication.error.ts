import { SharedDomainError } from './index.js';

export class EmailMicroserviceCommunicationError extends SharedDomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'EMAIL_MICROSERVICE_COMMUNICATION_ERROR', details);
    }
}
