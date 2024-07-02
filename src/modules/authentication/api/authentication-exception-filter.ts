import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { Response } from 'express';
import { AuthenticationDomainError } from '../domain/authentication-domain.error.js';
import { KeycloakUserNotFoundError } from '../domain/keycloak-user-not-found.error.js';
import { AuthenticationErrorI18nTypes, DbiamAuthenticationError } from './dbiam-authentication.error.js';

@Catch(AuthenticationDomainError)
export class AuthenticationExceptionFilter implements ExceptionFilter<AuthenticationDomainError> {
    private ERROR_MAPPINGS: Map<string, DbiamAuthenticationError> = new Map([
        [
            KeycloakUserNotFoundError.name,
            new DbiamAuthenticationError({
                code: 403,
                i18nKey: AuthenticationErrorI18nTypes.KEYCLOAK_USER_NOT_FOUND,
            }),
        ],
    ]);

    public catch(exception: AuthenticationDomainError, host: ArgumentsHost): void {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();
        const status: number = 403; //all errors regarding organisation specifications are InternalServerErrors at the moment

        const dbiamAuthenticationError: DbiamAuthenticationError = this.mapDomainErrorToDbiamError(exception);

        response.status(status);
        response.json(dbiamAuthenticationError);
    }

    private mapDomainErrorToDbiamError(error: AuthenticationDomainError): DbiamAuthenticationError {
        return (
            this.ERROR_MAPPINGS.get(error.constructor.name) ??
            new DbiamAuthenticationError({
                code: 403,
                i18nKey: AuthenticationErrorI18nTypes.AUTHENTICATION_ERROR,
            })
        );
    }
}
