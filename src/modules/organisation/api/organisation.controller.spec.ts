import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { plainToClass } from 'class-transformer';
import { MapperTestModule } from '../../../../test/utils/index.js';
import { SchulConnexError } from '../../../shared/error/schul-connex.error.js';
import { Paged } from '../../../shared/paging/paged.js';
import { OrganisationsTyp, Traegerschaft } from '../domain/organisation.enums.js';
import { CreateOrganisationBodyParams } from './create-organisation.body.params.js';
import { CreatedOrganisationDto } from './created-organisation.dto.js';
import { FindOrganisationQueryParams } from './find-organisation-query.param.js';
import { FindOrganisationDto } from './find-organisation.dto.js';
import { OrganisationApiMapperProfile } from './organisation-api.mapper.profile.js';
import { OrganisationByIdParams } from './organisation-by-id.params.js';
import { OrganisationController } from './organisation.controller.js';
import { OrganisationResponse } from './organisation.response.js';
import { OrganisationUc } from './organisation.uc.js';
import { UpdateOrganisationBodyParams } from './update-organisation.body.params.js';
import { UpdatedOrganisationDto } from './updated-organisation.dto.js';
import { OrganisationByIdBodyParams } from './organisation-by-id.body.params.js';

describe('OrganisationController', () => {
    let module: TestingModule;
    let organisationController: OrganisationController;
    let organisationUcMock: DeepMocked<OrganisationUc>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
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
                    traegerschaft: Traegerschaft.SONSTIGE,
                };

                const returnedValue: CreatedOrganisationDto = plainToClass(CreatedOrganisationDto, {
                    id: faker.string.uuid(),
                    kennung: faker.lorem.word(),
                    name: faker.lorem.word(),
                    namensergaenzung: faker.lorem.word(),
                    kuerzel: faker.lorem.word(),
                    typ: OrganisationsTyp.SONSTIGE,
                    traegerschaft: Traegerschaft.SONSTIGE,
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

    describe('updateOrganisation', () => {
        describe('when usecase returns a DTO', () => {
            it('should not throw an error', async () => {
                const params: OrganisationByIdParams = {
                    organisationId: faker.string.uuid(),
                };

                const body: UpdateOrganisationBodyParams = {
                    kennung: faker.lorem.word(),
                    name: faker.lorem.word(),
                    namensergaenzung: faker.lorem.word(),
                    kuerzel: faker.lorem.word(),
                    typ: OrganisationsTyp.SONSTIGE,
                    traegerschaft: Traegerschaft.SONSTIGE,
                    administriertVon: faker.lorem.word(),
                    zugehoerigZu: faker.lorem.word(),
                };

                const returnedValue: UpdatedOrganisationDto = plainToClass(UpdatedOrganisationDto, {
                    id: faker.string.uuid(),
                    kennung: faker.lorem.word(),
                    name: faker.lorem.word(),
                    namensergaenzung: faker.lorem.word(),
                    kuerzel: faker.lorem.word(),
                    typ: OrganisationsTyp.SONSTIGE,
                    traegerschaft: Traegerschaft.SONSTIGE,
                });
                organisationUcMock.updateOrganisation.mockResolvedValue(returnedValue);
                await expect(organisationController.updateOrganisation(params, body)).resolves.not.toThrow();
                expect(organisationUcMock.updateOrganisation).toHaveBeenCalledTimes(1);
            });
        });
        describe('when usecase returns a SchulConnexError', () => {
            it('should throw a HttpException', async () => {
                organisationUcMock.updateOrganisation.mockResolvedValue({} as SchulConnexError);
                await expect(
                    organisationController.updateOrganisation(
                        { organisationId: faker.string.uuid() } as OrganisationByIdParams,
                        {} as UpdateOrganisationBodyParams,
                    ),
                ).rejects.toThrow(HttpException);
                expect(organisationUcMock.updateOrganisation).toHaveBeenCalledTimes(1);
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
            traegerschaft: Traegerschaft.SONSTIGE,
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
                    traegerschaft: Traegerschaft.SONSTIGE,
                };

                const response2: OrganisationResponse = {
                    id: faker.string.uuid(),
                    kennung: queryParams.kennung ?? faker.lorem.word(),
                    name: queryParams.name ?? faker.lorem.word(),
                    namensergaenzung: faker.lorem.word(),
                    kuerzel: faker.lorem.word(),
                    typ: queryParams.typ ?? OrganisationsTyp.SONSTIGE,
                    traegerschaft: Traegerschaft.SONSTIGE,
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

    describe('getRootOrganisation', () => {
        const response: OrganisationResponse = plainToClass(OrganisationResponse, {
            id: faker.string.uuid(),
            kennung: faker.lorem.word(),
            name: faker.lorem.word(),
            namensergaenzung: faker.lorem.word(),
            kuerzel: faker.lorem.word(),
            typ: OrganisationsTyp.SONSTIGE,
            traegerschaft: Traegerschaft.SONSTIGE,
        });

        it('should return the root organisation if it exists', async () => {
            organisationUcMock.findRootOrganisation.mockResolvedValue(response);
            await expect(organisationController.getRootOrganisation()).resolves.not.toThrow();
            expect(organisationUcMock.findRootOrganisation).toHaveBeenCalledTimes(1);
        });

        it('should throw an error', async () => {
            const mockError: SchulConnexError = new SchulConnexError({
                beschreibung: 'SchulConneX',
                code: 500,
                titel: 'SchulConneX Fehler',
                subcode: '0',
            });
            organisationUcMock.findRootOrganisation.mockResolvedValue(mockError);
            await expect(organisationController.getRootOrganisation()).rejects.toThrow(HttpException);
            expect(organisationUcMock.findRootOrganisation).toHaveBeenCalledTimes(1);
        });
    });

    describe('getAdministrierteOrganisationen', () => {
        const params: OrganisationByIdParams = {
            organisationId: faker.string.uuid(),
        };

        describe('when usecase returns a OrganisationResponse', () => {
            it('should return all organizations that match', async () => {
                const response1: OrganisationResponse = {
                    id: faker.string.uuid(),
                    kennung: faker.lorem.word(),
                    name: faker.lorem.word(),
                    namensergaenzung: faker.lorem.word(),
                    kuerzel: faker.lorem.word(),
                    typ: OrganisationsTyp.SONSTIGE,
                };

                const response2: OrganisationResponse = {
                    id: faker.string.uuid(),
                    kennung: faker.lorem.word(),
                    name: faker.lorem.word(),
                    namensergaenzung: faker.lorem.word(),
                    kuerzel: faker.lorem.word(),
                    typ: OrganisationsTyp.SONSTIGE,
                };

                const mockedPagedResponse: Paged<OrganisationResponse> = {
                    items: [response1, response2],
                    limit: 10,
                    offset: 0,
                    total: 2,
                };

                organisationUcMock.findAdministriertVon.mockResolvedValueOnce(mockedPagedResponse);

                const result: Paged<OrganisationResponse> =
                    await organisationController.getAdministrierteOrganisationen(params);

                expect(result).toEqual(mockedPagedResponse);
                expect(organisationUcMock.findAdministriertVon).toHaveBeenCalledTimes(1);
                expect(result.items.length).toEqual(2);
            });
        });

        describe('when usecase returns a SchulConnexError', () => {
            it('should throw a HttpException', async () => {
                organisationUcMock.findAdministriertVon.mockResolvedValueOnce(
                    new SchulConnexError({ code: 500, subcode: '', titel: '', beschreibung: '' }),
                );
                await expect(organisationController.getAdministrierteOrganisationen(params)).rejects.toThrow(
                    HttpException,
                );
            });
        });
    });

    describe('getZugehoerigeOrganisationen', () => {
        const params: OrganisationByIdParams = {
            organisationId: faker.string.uuid(),
        };

        describe('when usecase returns a OrganisationResponse', () => {
            it('should return all organizations that match', async () => {
                const response1: OrganisationResponse = {
                    id: faker.string.uuid(),
                    kennung: faker.lorem.word(),
                    name: faker.lorem.word(),
                    namensergaenzung: faker.lorem.word(),
                    kuerzel: faker.lorem.word(),
                    typ: OrganisationsTyp.SONSTIGE,
                };

                const response2: OrganisationResponse = {
                    id: faker.string.uuid(),
                    kennung: faker.lorem.word(),
                    name: faker.lorem.word(),
                    namensergaenzung: faker.lorem.word(),
                    kuerzel: faker.lorem.word(),
                    typ: OrganisationsTyp.SONSTIGE,
                };

                const mockedPagedResponse: Paged<OrganisationResponse> = {
                    items: [response1, response2],
                    limit: 10,
                    offset: 0,
                    total: 2,
                };

                organisationUcMock.findZugehoerigZu.mockResolvedValue(mockedPagedResponse);

                const result: Paged<OrganisationResponse> =
                    await organisationController.getZugehoerigeOrganisationen(params);

                expect(result).toEqual(mockedPagedResponse);
                expect(organisationUcMock.findZugehoerigZu).toHaveBeenCalledTimes(1);
                expect(result.items.length).toEqual(2);
            });
        });

        describe('when usecase returns a SchulConnexError', () => {
            it('should throw a HttpException', async () => {
                organisationUcMock.findZugehoerigZu.mockResolvedValueOnce(
                    new SchulConnexError({ code: 500, subcode: '', titel: '', beschreibung: '' }),
                );
                await expect(organisationController.getZugehoerigeOrganisationen(params)).rejects.toThrow(
                    HttpException,
                );
            });
        });
    });

    describe('addAdministrierteOrganisation', () => {
        describe('when usecase succeeds', () => {
            it('should not throw an error', async () => {
                const params: OrganisationByIdParams = {
                    organisationId: faker.string.uuid(),
                };

                const body: OrganisationByIdBodyParams = {
                    organisationId: faker.string.uuid(),
                };

                organisationUcMock.setAdministriertVon.mockResolvedValue();

                await expect(organisationController.addAdministrierteOrganisation(params, body)).resolves.not.toThrow();
                expect(organisationUcMock.setAdministriertVon).toHaveBeenCalledTimes(1);
            });
        });

        describe('when usecase returns a SchulConnexError', () => {
            it('should throw a HttpException', async () => {
                const params: OrganisationByIdParams = {
                    organisationId: faker.string.uuid(),
                };

                const body: OrganisationByIdBodyParams = {
                    organisationId: faker.string.uuid(),
                };

                organisationUcMock.setAdministriertVon.mockResolvedValue({} as SchulConnexError);
                await expect(organisationController.addAdministrierteOrganisation(params, body)).rejects.toThrow(
                    HttpException,
                );

                expect(organisationUcMock.setAdministriertVon).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('addZugehoerigeOrganisation', () => {
        describe('when usecase succeeds', () => {
            it('should not throw an error', async () => {
                const params: OrganisationByIdParams = {
                    organisationId: faker.string.uuid(),
                };

                const body: OrganisationByIdBodyParams = {
                    organisationId: faker.string.uuid(),
                };

                organisationUcMock.setZugehoerigZu.mockResolvedValue();

                await expect(organisationController.addZugehoerigeOrganisation(params, body)).resolves.not.toThrow();
                expect(organisationUcMock.setZugehoerigZu).toHaveBeenCalledTimes(1);
            });
        });

        describe('when usecase returns a SchulConnexError', () => {
            it('should throw a HttpException', async () => {
                const params: OrganisationByIdParams = {
                    organisationId: faker.string.uuid(),
                };

                const body: OrganisationByIdBodyParams = {
                    organisationId: faker.string.uuid(),
                };

                organisationUcMock.setZugehoerigZu.mockResolvedValue({} as SchulConnexError);
                await expect(organisationController.addZugehoerigeOrganisation(params, body)).rejects.toThrow(
                    HttpException,
                );

                expect(organisationUcMock.setZugehoerigZu).toHaveBeenCalledTimes(1);
            });
        });
    });
});
