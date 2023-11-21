import { Mapper, MappingProfile, createMap } from '@automapper/core';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { Inject } from '@nestjs/common';
import { SchulConnexError } from './schul-connex.error.js';
import { EntityCouldNotBeCreated } from './entity-could-not-be-created.error.js';
import { EntityCouldNotBeUpdated } from './entity-could-not-be-updated.error.js';
import { EntityNotFoundError } from './entity-not-found.error.js';
import { KeycloakClientError } from './keycloak-client.error.js';
import { MismatchedRevisionError } from './mismatched-revision.error.js';
import { PersonAlreadyExistsError } from './person-already-exists.error.js';

export class DomainToSchulConnexErrorMapper extends AutomapperProfile {
    public constructor(@Inject(getMapperToken()) mapper: Mapper) {
        super(mapper);
    }

    public override get profile(): MappingProfile {
        return (mapper: Mapper) => {
            createMap(mapper, EntityCouldNotBeCreated, SchulConnexError);
            createMap(mapper, EntityCouldNotBeUpdated, SchulConnexError);
            createMap(mapper, EntityNotFoundError, SchulConnexError);
            createMap(mapper, KeycloakClientError, SchulConnexError);
            createMap(mapper, MismatchedRevisionError, SchulConnexError);
            createMap(mapper, PersonAlreadyExistsError, SchulConnexError);
        };
    }
}
