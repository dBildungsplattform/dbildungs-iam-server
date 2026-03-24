import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { Response } from 'express';
import { SchulConnexError } from '../../../shared/error/schul-connex.error.js';
import {
    SharedDomainError,
    EntityAlreadyExistsError,
    EntityCouldNotBeCreated,
    EntityCouldNotBeDeleted,
    EntityCouldNotBeUpdated,
    EntityNotFoundError,
    InvalidAttributeLengthError,
    InvalidCharacterSetError,
    InvalidNameError,
    KeycloakClientError,
    MismatchedRevisionError,
    MissingPermissionsError,
    PersonAlreadyExistsError,
} from '../../../shared/error/index.js';
import { ExceedsLimitError } from '../../../shared/error/exceeds-limit.error.js';
import { UserExternalDataWorkflowError } from '../../../shared/error/user-externaldata-workflow.error.js';

@Catch(SharedDomainError)
export class SchulConnexSharedErrorFilter implements ExceptionFilter<SharedDomainError> {
    private ERROR_MAPPINGS: Map<string, SchulConnexError> = new Map([
        [
            EntityCouldNotBeCreated.name,
            new SchulConnexError({
                code: 500,
                subcode: '00',
                titel: 'Interner Serverfehler',
                beschreibung: 'Es ist ein interner Fehler aufgetreten. Entität konnte nicht erstellt werden.',
            }),
        ],
        [
            EntityCouldNotBeUpdated.name,
            new SchulConnexError({
                code: 500,
                subcode: '00',
                titel: 'Interner Serverfehler',
                beschreibung: 'Es ist ein interner Fehler aufgetreten. Entität konnte nicht aktualisiert werden.',
            }),
        ],
        [
            EntityCouldNotBeDeleted.name,
            new SchulConnexError({
                code: 500,
                subcode: '00',
                titel: 'Interner Serverfehler',
                beschreibung: 'Es ist ein interner Fehler aufgetreten. Entität konnte nicht gelöscht werden.',
            }),
        ],
        [
            EntityNotFoundError.name,
            new SchulConnexError({
                code: 404,
                subcode: '01',
                titel: 'Angefragte Entität existiert nicht',
                beschreibung: 'Die angeforderte Entität existiert nicht',
            }),
        ],
        [
            KeycloakClientError.name,
            new SchulConnexError({
                code: 500,
                subcode: '00',
                titel: 'Interner Serverfehler',
                beschreibung: 'Es ist ein interner Fehler aufgetreten. Ein Keycloak Fehler ist aufgetreten.',
            }),
        ],
        [
            MismatchedRevisionError.name,
            new SchulConnexError({
                code: 409,
                subcode: '00',
                titel: 'Konflikt mit dem aktuellen Zustand der Resource',
                beschreibung:
                    'Die Entität wurde eventuell durch Dritte verändert. Die Revisionsnummer stimmt nicht überein.',
            }),
        ],
        [
            PersonAlreadyExistsError.name,
            new SchulConnexError({
                code: 400,
                subcode: '00',
                titel: 'Fehlerhafte Anfrage',
                beschreibung: 'Die Anfrage ist fehlerhaft: Die Person existiert bereits.',
            }),
        ],
        [
            EntityAlreadyExistsError.name,
            new SchulConnexError({
                code: 400,
                subcode: '00',
                titel: 'Fehlerhafte Anfrage',
                beschreibung: 'Die Anfrage ist Fehlerhaft: Die Entität existiert bereits.',
            }),
        ],
        [
            InvalidAttributeLengthError.name,
            new SchulConnexError({
                code: 400,
                subcode: '07',
                titel: 'Attributwerte haben eine ungültige Länge',
                beschreibung: 'Textlänge ist nicht valide',
            }),
        ],
        [
            InvalidCharacterSetError.name,
            new SchulConnexError({
                code: 400,
                subcode: '08',
                titel: 'Attributwerte entsprechen nicht dem gültigen Zeichensatz',
                beschreibung: 'Text entspricht nicht dem Zeichensatz',
            }),
        ],
        [
            InvalidNameError.name,
            new SchulConnexError({
                code: 400,
                subcode: '00',
                titel: 'Fehlerhafte Anfrage',
                beschreibung: 'Die Anfrage ist fehlerhaft: Es konnte kein Benutzername generiert werden',
            }),
        ],
        [
            MissingPermissionsError.name,
            new SchulConnexError({
                code: 404,
                subcode: '01',
                titel: 'Angefragte Entität existiert nicht',
                beschreibung: 'Die angeforderte Entität existiert nicht',
            }),
        ],
        [
            ExceedsLimitError.name,
            new SchulConnexError({
                code: 400,
                subcode: '01',
                titel: 'Die Anfrage überschreitete das Limit',
                beschreibung: 'Die Anfrage überschreitete das Limit',
            }),
        ],
        [
            UserExternalDataWorkflowError.name,
            new SchulConnexError({
                code: 500,
                subcode: '01',
                titel: 'Interner Serverfehler',
                beschreibung:
                    'Es ist ein interner Fehler aufgetreten. Externe Userdaten können nicht bereitgestellt werden.',
            }),
        ],
    ]);

    public catch(exception: SharedDomainError, host: ArgumentsHost): void {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();

        const schulConnexError: SchulConnexError = this.mapDomainErrorToSchulConnexError(exception);

        response.status(schulConnexError.code);
        response.json(schulConnexError);
    }

    private mapDomainErrorToSchulConnexError(error: SharedDomainError): SchulConnexError {
        return (
            this.ERROR_MAPPINGS.get(error.constructor.name) ??
            new SchulConnexError({
                code: 500,
                subcode: '00',
                titel: 'Interner Serverfehler',
                beschreibung:
                    'Es ist ein interner Fehler aufgetreten. Der aufgetretene Fehler konnte nicht verarbeitet werden',
            })
        );
    }
}
