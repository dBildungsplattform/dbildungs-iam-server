import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { plainToClass } from 'class-transformer';
import { MapperTestModule } from '../../../../test/utils/index.js';
import { ErrorModule } from '../../../shared/error/error.module.js';
import { SchulConnexError } from '../../../shared/error/schul-connex.error.js';
import { Paged } from '../../../shared/paging/paged.js';
import { OrganisationsTyp } from '../domain/organisation.enum.js';
import { CreateOrganisationBodyParams } from './create-organisation.body.params.js';
import { CreatedOrganisationDto } from './created-organisation.dto.js';
import { FindOrganisationQueryParams } from './find-organisation-query.param.js';
import { FindOrganisationDto } from './find-organisation.dto.js';
import { OrganisationApiMapperProfile } from './organisation-api.mapper.profile.js';
import { OrganisationByIdParams } from './organisation-by-id.params.js';
import { OrganisationController } from './organisation.controller.js';
import { OrganisationResponse } from './organisation.response.js';
import { OrganisationUc } from './organisation.uc.js';

describe('OrganisationController', () => {
    let module: TestingModule;
    let organisationController: OrganisationController;
    let organisationUcMock: DeepMocked<OrganisationUc>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule, ErrorModule],
            providers: [
                OrganisationController,
                OrganisationApiMapperProfile,
                {
                    provide: OrganisationUc,
                    useValue: createMock<OrganisationUc>(),
                },
            ],
        }).compile();
        organisationController = module.get(OrganisationController);
        organisationUcMock = module.get(OrganisationUc);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(organisationController).toBeDefined();
    });

    describe('createOrganisation', () => {
        describe('when usecase returns a DTO', () => {
            it('should not throw an error', async () => {
                const params: CreateOrganisationBodyParams = {
                    kennung: faker.lorem.word(),
                    name: faker.lorem.word(),
                    namensergaenzung: faker.lorem.word(),
                    kuerzel: faker.lorem.word(),
                    typ: OrganisationsTyp.SONSTIGE,
                };

                const returnedValue: CreatedOrganisationDto = plainToClass(CreatedOrganisationDto, {
                    id: faker.string.uuid(),
                    kennung: faker.lorem.word(),
                    name: faker.lorem.word(),
                    namensergaenzung: faker.lorem.word(),
                    kuerzel: faker.lorem.word(),
                    typ: OrganisationsTyp.SONSTIGE,
                });
                organisationUcMock.createOrganisation.mockResolvedValue(returnedValue);
                await expect(organisationController.createOrganisation(params)).resolves.not.toThrow();
                expect(organisationUcMock.createOrganisation).toHaveBeenCalledTimes(1);
            });
        });
        describe('when usecase returns a SchulConnexError', () => {
            it('should throw a HttpException', async () => {
                organisationUcMock.createOrganisation.mockResolvedValue({} as SchulConnexError);
                await expect(
                    organisationController.createOrganisation({} as CreateOrganisationBodyParams),
                ).rejects.toThrow(HttpException);
                expect(organisationUcMock.createOrganisation).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('findOrganisationById', () => {
        const params: OrganisationByIdParams = {
            organisationId: faker.string.uuid(),
        };
        const response: OrganisationResponse = plainToClass(OrganisationResponse, {
            id: params.organisationId,
            kennung: faker.lorem.word(),
            name: faker.lorem.word(),
            namensergaenzung: faker.lorem.word(),
            kuerzel: faker.lorem.word(),
            typ: OrganisationsTyp.SONSTIGE,
        });

        describe('when usecase returns an OrganisationResponse', () => {
            it('should not throw', async () => {
                organisationUcMock.findOrganisationById.mockResolvedValue(response);
                await expect(organisationController.findOrganisationById(params)).resolves.not.toThrow();
                expect(organisationUcMock.findOrganisationById).toHaveBeenCalledTimes(1);
            });
        });

        describe('when usecase returns a SchulConnexError', () => {
            it('should throw HttpException', async () => {
                const mockError: SchulConnexError = new SchulConnexError({
                    beschreibung: 'SchulConneX',
                    code: 500,
                    titel: 'SchulConneX Fehler',
                    subcode: '0',
                });
                organisationUcMock.findOrganisationById.mockResolvedValue(mockError);
                await expect(organisationController.findOrganisationById(params)).rejects.toThrow(HttpException);
                expect(organisationUcMock.findOrganisationById).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('findOrganizations', () => {
        const queryParams: FindOrganisationQueryParams = {
            kennung: faker.lorem.word(),
            name: faker.lorem.word(),
            typ: OrganisationsTyp.SONSTIGE,
        };

        describe('when finding organizations with given query params', () => {
            it('should find all organizations that match', async () => {
                const organisationDto: FindOrganisationDto = {
                    kennung: queryParams.kennung,
                    name: queryParams.name,
                    typ: queryParams.typ,
                };

                const response1: OrganisationResponse = {
                    id: faker.string.uuid(),
                    kennung: queryParams.kennung ?? faker.lorem.word(),
                    name: queryParams.name ?? faker.lorem.word(),
                    namensergaenzung: faker.lorem.word(),
                    kuerzel: faker.lorem.word(),
                    typ: queryParams.typ ?? OrganisationsTyp.SONSTIGE,
                };

                const response2: OrganisationResponse = {
                    id: faker.string.uuid(),
                    kennung: queryParams.kennung ?? faker.lorem.word(),
                    name: queryParams.name ?? faker.lorem.word(),
                    namensergaenzung: faker.lorem.word(),
                    kuerzel: faker.lorem.word(),
                    typ: queryParams.typ ?? OrganisationsTyp.SONSTIGE,
                };

                const mockedPagedResponse: Paged<OrganisationResponse> = {
                    items: [response1, response2],
                    limit: 10,
                    offset: 0,
                    total: 2,
                };

                organisationUcMock.findAll.mockResolvedValue(mockedPagedResponse);

                const result: Paged<OrganisationResponse> =
                    await organisationController.findOrganizations(organisationDto);

                expect(result).toEqual(mockedPagedResponse);
                expect(organisationUcMock.findAll).toHaveBeenCalledTimes(1);
                expect(result.items.length).toEqual(2);
            });
        });
    });
});
