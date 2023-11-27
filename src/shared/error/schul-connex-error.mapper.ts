import { HttpException } from '@nestjs/common';
import { DomainError } from './domain.error.js';
import { EntityCouldNotBeCreated } from './entity-could-not-be-created.error.js';
import { EntityCouldNotBeUpdated } from './entity-could-not-be-updated.error.js';
import { EntityNotFoundError } from './entity-not-found.error.js';
import { KeycloakClientError } from './keycloak-client.error.js';
import { MismatchedRevisionError } from './mismatched-revision.error.js';
import { PersonAlreadyExistsError } from './person-already-exists.error.js';
import { SchulConnexError } from './schul-connex.error.js';

export class SchulConnexErrorMapper {
    private static SCHULCONNEX_ERROR_MAPPINGS: Map<string, SchulConnexError> = new Map([
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
    ]);

    private static NO_MAPPING_FOUND: SchulConnexError = new SchulConnexError({
        code: 500,
        subcode: '00',
        titel: 'Interner Serverfehler',
        beschreibung: 'Es ist ein interner Fehler aufgetreten. Der aufgetretene Fehler konnte nicht verarbeitet werden',
    });

    public static mapSchulConnexErrorToHttpExcetion(error: SchulConnexError): HttpException {
        return new HttpException(error, error.code);
    }

    public static mapDomainErrorToSchulConnexError(error: DomainError): SchulConnexError {
        return this.SCHULCONNEX_ERROR_MAPPINGS.get(error.constructor.name) ?? this.NO_MAPPING_FOUND;
    }
}
