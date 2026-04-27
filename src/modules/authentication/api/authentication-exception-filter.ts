import { ArgumentsHost, Catch, ExceptionFilter, UnauthorizedException } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { Response } from 'express';
import { AuthenticationDomainError } from '../domain/authentication-domain.error.js';
import { KeycloakUserNotFoundError } from '../domain/keycloak-user-not-found.error.js';
import { AuthenticationErrorI18nTypes, DbiamAuthenticationError } from './dbiam-authentication.error.js';
import { RequiredStepUpLevelNotMetError } from '../domain/required-step-up-level-not-met.error.js';

@Catch(AuthenticationDomainError, UnauthorizedException)
export class AuthenticationExceptionFilter implements ExceptionFilter<AuthenticationDomainError> {
    private ERROR_MAPPINGS: Map<string, DbiamAuthenticationError> = new Map([
        [
            KeycloakUserNotFoundError.name,
            new DbiamAuthenticationError({
                code: 403,
                i18nKey: AuthenticationErrorI18nTypes.KEYCLOAK_USER_NOT_FOUND,
            }),
        ],
        [
            RequiredStepUpLevelNotMetError.name,
            new DbiamAuthenticationError({
                code: 403,
                i18nKey: AuthenticationErrorI18nTypes.REQUIRED_STEP_UP_LEVEL_NOT_MET,
            }),
        ],
        [
            UnauthorizedException.name,
            new DbiamAuthenticationError({
                code: 401,
                i18nKey: AuthenticationErrorI18nTypes.UNAUTHORIZED,
            }),
        ],
    ]);

    public catch(exception: AuthenticationDomainError | UnauthorizedException, host: ArgumentsHost): void {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();

        const dbiamAuthenticationError: DbiamAuthenticationError = this.mapDomainErrorToDbiamError(exception);

        response.status(dbiamAuthenticationError.code);
        response.json(dbiamAuthenticationError);
    }

    private mapDomainErrorToDbiamError(
        error: AuthenticationDomainError | UnauthorizedException,
    ): DbiamAuthenticationError {
        return (
            this.ERROR_MAPPINGS.get(error.constructor.name) ??
            new DbiamAuthenticationError({
                code: 403,
                i18nKey: AuthenticationErrorI18nTypes.AUTHENTICATION_ERROR,
            })
        );
    }
}
