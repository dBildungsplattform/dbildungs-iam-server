import { Mapper } from '@automapper/core';
import { Test, TestingModule } from '@nestjs/testing';
import { getMapperToken } from '@automapper/nestjs';
import { DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { faker } from '@faker-js/faker';
import { CreateOrganisationBodyParams } from './create-organisation.body.params.js';
import { OrganisationsTyp, Traegerschaft } from '../domain/organisation.enums.js';
import { CreateOrganisationDto } from './create-organisation.dto.js';
import { MappingError } from '../../../shared/error/mapping.error.js';
import { OrganisationApiMapperProfile } from './organisation-api.mapper.profile.js';
import { OrganisationDo } from '../domain/organisation.do.js';
import { CreatedOrganisationDto } from './created-organisation.dto.js';
import { OrganisationResponse } from './organisation.response.js';
import { FindOrganisationDto } from './find-organisation.dto.js';

describe('OrganisationApiMapperProfile', () => {
    let module: TestingModule;
    let sut: Mapper;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [OrganisationApiMapperProfile],
        }).compile();
        sut = module.get(getMapperToken());
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('when the mapper is initialized', () => {
        const options: {
            kennung: string;
            kuerzel: string;
            name: string;
            namensergaenzung: string;
            typ: OrganisationsTyp;
            traegerschaft: Traegerschaft;
        } = {
            kennung: faker.lorem.word(),
            kuerzel: faker.lorem.word(),
            name: faker.lorem.word(),
            namensergaenzung: faker.lorem.word(),
            typ: OrganisationsTyp.SONSTIGE,
            traegerschaft: Traegerschaft.SONSTIGE,
        };

        it('should map CreateOrganisationBodyParams to CreateOrganisationDto', () => {
            const params: CreateOrganisationBodyParams = options;

            expect(() => sut.map(params, CreateOrganisationBodyParams, CreateOrganisationDto)).not.toThrowError(
                MappingError,
            );
        });

        it('should map CreateOrganisationDto to OrganisationDo', () => {
            const createOrganisationDto: CreateOrganisationDto = options;

            expect(() => sut.map(createOrganisationDto, CreateOrganisationDto, OrganisationDo<false>)).not.toThrowError(
                MappingError,
            );
        });

        it('should map OrganisationDo to CreatedOrganisationDto', () => {
            const organisationDo: OrganisationDo<true> = DoFactory.createOrganisation(true);

            expect(() => sut.map(organisationDo, OrganisationDo<true>, CreatedOrganisationDto)).not.toThrowError(
                MappingError,
            );
        });

        it('should map CreatedOrganisationDto to OrganisationResponse', () => {
            const createdOrganisationDto: CreatedOrganisationDto = {
                id: faker.string.uuid(),
                kennung: options.kennung,
                kuerzel: options.kuerzel,
                name: options.name,
                namensergaenzung: options.namensergaenzung,
                typ: options.typ,
            };

            expect(() =>
                sut.map(createdOrganisationDto, CreatedOrganisationDto, OrganisationResponse),
            ).not.toThrowError(MappingError);
        });

        it('should map FindOrganisationDto to OrganisationDo', () => {
            const findOrganisationDto: FindOrganisationDto = {
                kennung: options.kennung,
                name: options.name,
                typ: options.typ,
            };

            expect(() => sut.map(findOrganisationDto, FindOrganisationDto, OrganisationDo<false>)).not.toThrowError(
                MappingError,
            );
        });
    });
});
