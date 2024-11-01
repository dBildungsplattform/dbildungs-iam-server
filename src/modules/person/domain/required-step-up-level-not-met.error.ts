import { PersonDomainError } from './person-domain.error.js';

export class RequiredStepUpLevelNotMetError extends PersonDomainError {
    public constructor(entityId: string | undefined, details?: unknown[] | Record<string, undefined>) {
        super(`The action could not be perfomed, bequase the required step up level was not met`, entityId, details);
    }
}
