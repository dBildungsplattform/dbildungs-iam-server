import { DomainError } from './domain.error.js';

export class ItsLearningError extends DomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'ITS_LEARNING_ERROR', details);
    }
}
