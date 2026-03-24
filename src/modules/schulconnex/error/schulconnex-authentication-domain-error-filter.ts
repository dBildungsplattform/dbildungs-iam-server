import { ArgumentsHost, Catch, ExceptionFilter, UnauthorizedException } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { Response } from 'express';
import { SchulConnexError } from '../../../shared/error/schul-connex.error.js';
import { AuthenticationDomainError } from '../../authentication/domain/authentication-domain.error.js';
import { DomainError } from '../../../shared/error/index.js';
import { KeycloakUserNotFoundError } from '../../authentication/domain/keycloak-user-not-found.error.js';
import { RequiredStepUpLevelNotMetError } from '../../authentication/domain/required-step-up-level-not-met.error.js';

@Catch(AuthenticationDomainError, UnauthorizedException)
export class SchulConnexAuthenticationDomainErrorFilter implements ExceptionFilter<AuthenticationDomainError> {
    private ERROR_MAPPINGS: Map<string, SchulConnexError> = new Map([
        [
            KeycloakUserNotFoundError.name,
            new SchulConnexError({
                code: 403,
                subcode: '00',
                titel: 'Fehlende Rechte',
                beschreibung:
                    'Die Autorisierung war erfolgreich, aber die erforderlichen Rechte für die Nutzung dieses Endpunktes sind nicht vorhanden.',
            }),
        ],
        [
            RequiredStepUpLevelNotMetError.name,
            new SchulConnexError({
                code: 403,
                subcode: '00',
                titel: 'Fehlende Rechte',
                beschreibung:
                    'Die Autorisierung war erfolgreich, aber die erforderlichen Rechte für die Nutzung dieses Endpunktes sind nicht vorhanden.',
            }),
        ],
        [
            UnauthorizedException.name,
            new SchulConnexError({
                code: 401,
                subcode: '00',
                titel: 'Zugang verweigert',
                beschreibung: 'Die Anfrage konnte aufgrund fehlender Autorisierung nicht verarbeitet werden.',
            }),
        ],
    ]);

    public catch(exception: AuthenticationDomainError | UnauthorizedException, host: ArgumentsHost): void {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();

        const schulConnexError: SchulConnexError = this.mapDomainErrorToSchulConnexError(exception);

        response.status(schulConnexError.code);
        response.json(schulConnexError);
    }

    private mapDomainErrorToSchulConnexError(error: DomainError | UnauthorizedException): SchulConnexError {
        return (
            this.ERROR_MAPPINGS.get(error.constructor.name) ??
            new SchulConnexError({
                code: 403,
                subcode: '00',
                titel: 'Authentifizierung fehlgeschlagen',
                beschreibung: error.message,
            })
        );
    }
}
