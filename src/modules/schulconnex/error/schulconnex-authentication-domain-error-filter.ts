import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { Response } from 'express';
import { SchulConnexError } from '../../../shared/error/schul-connex.error.js';
import { AuthenticationDomainError } from '../../authentication/domain/authentication-domain.error.js';
import { SCHULCONNEX_ERROR_MAPPINGS } from '../../../shared/error/schul-connex-error.mapping.js';
import { DomainError } from '../../../shared/error/index.js';

@Catch(AuthenticationDomainError)
export class SchulConnexAuthenticationDomainErrorFilter implements ExceptionFilter<AuthenticationDomainError> {
    public catch(exception: AuthenticationDomainError, host: ArgumentsHost): void {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();

        const schulConnexError: SchulConnexError = this.mapDomainErrorToSchulConnexError(exception);

        response.status(schulConnexError.code);
        response.json(schulConnexError);
    }

    public mapDomainErrorToSchulConnexError(error: DomainError): SchulConnexError {
        return (
            SCHULCONNEX_ERROR_MAPPINGS.get(error.constructor.name) ??
            new SchulConnexError({
                code: 403,
                subcode: '00',
                titel: 'Authentifizierung fehlgeschlagen',
                beschreibung: error.message,
            })
        );
    }
}
