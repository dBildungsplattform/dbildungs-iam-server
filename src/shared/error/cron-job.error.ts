import { DomainError } from './domain.error.js';

export class CronJobError extends DomainError {
    public constructor(message: string, details?: unknown[] | Record<string, unknown>) {
        super(message, 'CRON_JOB_ERROR', details);
    }
}
