import 'reflect-metadata';
import { Mapper, MappingProfile, constructUsing, createMap, forMember, fromValue } from '@automapper/core';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { HttpException, Inject } from '@nestjs/common';
import { EntityCouldNotBeCreated } from './entity-could-not-be-created.error.js';
import { EntityCouldNotBeUpdated } from './entity-could-not-be-updated.error.js';
import { EntityNotFoundError } from './entity-not-found.error.js';
import { KeycloakClientError } from './keycloak-client.error.js';
import { MismatchedRevisionError } from './mismatched-revision.error.js';
import { PersonAlreadyExistsError } from './person-already-exists.error.js';
import { SchulConnexError } from './schul-connex.error.js';

export class DomainToSchulConnexErrorMapper extends AutomapperProfile {
    public constructor(@Inject(getMapperToken()) mapper: Mapper) {
        super(mapper);
    }

    public override get profile(): MappingProfile {
        return (mapper: Mapper) => {
            createMap(
                mapper,
                EntityCouldNotBeCreated,
                SchulConnexError,
                forMember((dest: SchulConnexError) => dest.code, fromValue(500)),
                forMember((dest: SchulConnexError) => dest.subcode, fromValue('00')),
                forMember((dest: SchulConnexError) => dest.titel, fromValue('Interner Serverfehler')),
                forMember(
                    (dest: SchulConnexError) => dest.beschreibung,
                    fromValue('Es ist ein interner Fehler aufgetreten. Entität konnte nicht erstellt werden.'),
                ),
            );
            createMap(
                mapper,
                EntityCouldNotBeUpdated,
                SchulConnexError,
                forMember((dest: SchulConnexError) => dest.code, fromValue(500)),
                forMember((dest: SchulConnexError) => dest.subcode, fromValue('00')),
                forMember((dest: SchulConnexError) => dest.titel, fromValue('Interner Serverfehler')),
                forMember(
                    (dest: SchulConnexError) => dest.beschreibung,
                    fromValue('Es ist ein interner Fehler aufgetreten. Entität konnte nicht aktualisiert werden.'),
                ),
            );

            createMap(
                mapper,
                EntityNotFoundError,
                SchulConnexError,
                forMember((dest: SchulConnexError) => dest.code, fromValue(404)),
                forMember((dest: SchulConnexError) => dest.subcode, fromValue('01')),
                forMember((dest: SchulConnexError) => dest.titel, fromValue('Angefragte Entität existiert nicht')),
                forMember(
                    (dest: SchulConnexError) => dest.beschreibung,
                    fromValue('Die angeforderte Entität existiert nicht.'),
                ),
            );

            createMap(
                mapper,
                KeycloakClientError,
                SchulConnexError,
                forMember((dest: SchulConnexError) => dest.code, fromValue(500)),
                forMember((dest: SchulConnexError) => dest.subcode, fromValue('00')),
                forMember((dest: SchulConnexError) => dest.titel, fromValue('Interner Serverfehler')),
                forMember(
                    (dest: SchulConnexError) => dest.beschreibung,
                    fromValue('Es ist ein interner Fehler aufgetreten.'),
                ),
            );

            createMap(
                mapper,
                MismatchedRevisionError,
                SchulConnexError,
                forMember((dest: SchulConnexError) => dest.code, fromValue(409)),
                forMember((dest: SchulConnexError) => dest.subcode, fromValue('00')),
                forMember(
                    (dest: SchulConnexError) => dest.titel,
                    fromValue('Konflikt mit dem aktuellen Zustand der Resource'),
                ),
                forMember(
                    (dest: SchulConnexError) => dest.beschreibung,
                    fromValue(
                        'Die Entität wurde eventuell durch Dritte verändert. Die Revisionsnummer stimmt nicht überein.',
                    ),
                ),
            );

            createMap(
                mapper,
                PersonAlreadyExistsError,
                SchulConnexError,
                forMember((dest: SchulConnexError) => dest.code, fromValue(400)),
                forMember((dest: SchulConnexError) => dest.subcode, fromValue('00')),
                forMember((dest: SchulConnexError) => dest.titel, fromValue('Fehlerhafte Anfrage')),
                forMember(
                    (dest: SchulConnexError) => dest.beschreibung,
                    fromValue('Die Anfrage ist fehlerhaft: Die Person existiert bereits.'),
                ),
            );

            createMap(
                mapper,
                SchulConnexError,
                HttpException,
                constructUsing((scError: SchulConnexError) => new HttpException(scError, scError.code)),
            );
        };
    }
}
