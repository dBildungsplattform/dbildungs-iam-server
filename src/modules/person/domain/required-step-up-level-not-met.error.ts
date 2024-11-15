import { AuthenticationDomainError } from '../../authentication/domain/authentication-domain.error.js';

export class RequiredStepUpLevelNotMetError extends AuthenticationDomainError {
    public constructor(details?: unknown[] | Record<string, undefined>) {
        super(`The action could not be perfomed, because the required step up level was not met`, undefined, details);
    }
}
