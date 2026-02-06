import { RollenerweiterungDomainError } from './rollenerweiterung-domain.error.js';

export class ApplyRollenerweiterungWorkflowNotInitializedError extends RollenerweiterungDomainError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(`Rollenerweiterungen could not be applied, because workflow wasn't initialized`, undefined, details);
    }
}
