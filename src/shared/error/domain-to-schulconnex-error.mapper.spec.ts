import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Test, TestingModule } from '@nestjs/testing';
import { MapperTestModule } from '../../../test/utils/index.js';
import { DomainToSchulConnexErrorMapper } from './domain-to-schulconnex-error.mapper.js';
import { EntityCouldNotBeCreated } from './entity-could-not-be-created.error.js';
import { EntityCouldNotBeUpdated } from './entity-could-not-be-updated.error.js';
import { EntityNotFoundError } from './entity-not-found.error.js';
import { KeycloakClientError } from './keycloak-client.error.js';
import { MappingError } from './mapping.error.js';
import { MismatchedRevisionError } from './mismatched-revision.error.js';
import { PersonAlreadyExistsError } from './person-already-exists.error.js';
import { SchulConnexError } from './schul-connex.error.js';
import { HttpException } from '@nestjs/common';

describe('DomainToSchulConnexErrorMapper', () => {
    let module: TestingModule;
    let sut: Mapper;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [DomainToSchulConnexErrorMapper],
        }).compile();
        sut = module.get(getMapperToken());
    });

    // AI next 50 lines
    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('when mapper is initialized', () => {
        it('should map EntityCouldNotBeCreated to SchulConnexError', () => {
            expect(() => sut.map({} as EntityCouldNotBeCreated, EntityCouldNotBeCreated, SchulConnexError)).not.toThrow(
                MappingError,
            );
        });

        it('should map EntityCouldNotBeUpdated to SchulConnexError', () => {
            expect(() => sut.map({} as EntityCouldNotBeUpdated, EntityCouldNotBeUpdated, SchulConnexError)).not.toThrow(
                MappingError,
            );
        });

        it('should map EntityNotFoundError to SchulConnexError', () => {
            expect(() => sut.map({} as EntityNotFoundError, EntityNotFoundError, SchulConnexError)).not.toThrow(
                MappingError,
            );
        });

        it('should map KeycloakClientError to SchulConnexError', () => {
            expect(() => sut.map({} as KeycloakClientError, KeycloakClientError, SchulConnexError)).not.toThrow(
                MappingError,
            );
        });

        it('should map MismatchedRevisionError to SchulConnexError', () => {
            expect(() => sut.map({} as MismatchedRevisionError, MismatchedRevisionError, SchulConnexError)).not.toThrow(
                MappingError,
            );
        });

        it('should map PersonAlreadyExistsError to SchulConnexError', () => {
            expect(() =>
                sut.map({} as PersonAlreadyExistsError, PersonAlreadyExistsError, SchulConnexError),
            ).not.toThrow(MappingError);
        });

        it('should map SchulConnexError to HttpException', () => {
            expect(() => sut.map({} as SchulConnexError, SchulConnexError, HttpException)).not.toThrow(MappingError);
        });
    });
});
