import { AuthenticationDomainError } from '../../authentication/domain/authentication-domain.error.js';

export class RequiredStepUpLevelNotMetError extends AuthenticationDomainError {
    public constructor() {
        super(`The action could not be perfomed, bequase the required step up level was not met`, undefined, undefined);
    }
}
