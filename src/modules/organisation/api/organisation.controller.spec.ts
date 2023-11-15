import { MapperTestModule } from '../../../../test/utils/index.js';
import { OrganisationApiMapperProfile } from './organisation-api.mapper.profile.js';
import { OrganisationController } from './organisation.controller.js';
import { OrganisationUc } from './organisation.uc.js';
import { Test, TestingModule } from '@nestjs/testing';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { CreateOrganisationBodyParams } from './create-organisation.body.params.js';
import { OrganisationsTyp } from '../domain/organisation.enum.js';
import { faker } from '@faker-js/faker';
import { CreatedOrganisationDto } from './created-organisation.dto.js';
import { OrganisationByIdParams } from './organisation-by-id.params.js';
import { OrganisationResponse } from './organisation.response.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { HttpException } from '@nestjs/common';
import { FindOrganisationQueryParams } from './find-organisation-query.param.js';
import { Paged } from '../../../shared/paging/paged.js';
import { FindOrganisationDto } from './find-organisation.dto.js';
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
        it('should not throw an error', async () => {
            const params: CreateOrganisationBodyParams = {
                kennung: faker.lorem.word(),
                name: faker.lorem.word(),
                namensergaenzung: faker.lorem.word(),
                kuerzel: faker.lorem.word(),
                typ: OrganisationsTyp.SONSTIGE,
            };

            const returnedValue: CreatedOrganisationDto = {
                id: faker.string.uuid(),
                kennung: faker.lorem.word(),
                name: faker.lorem.word(),
                namensergaenzung: faker.lorem.word(),
                kuerzel: faker.lorem.word(),
                typ: OrganisationsTyp.SONSTIGE,
            };
            organisationUcMock.createOrganisation.mockResolvedValue(returnedValue);
            await expect(organisationController.createOrganisation(params)).resolves.not.toThrow();
            expect(organisationUcMock.createOrganisation).toHaveBeenCalledTimes(1);
        });
    });

    describe('findOrganisationById', () => {
        const params: OrganisationByIdParams = {
            organisationId: faker.string.uuid(),
        };
        const response: OrganisationResponse = {
            id: params.organisationId,
            kennung: faker.lorem.word(),
            name: faker.lorem.word(),
            namensergaenzung: faker.lorem.word(),
            kuerzel: faker.lorem.word(),
            typ: OrganisationsTyp.SONSTIGE,
        };

        it('should find an organization by it id', async () => {
            organisationUcMock.findOrganisationById.mockResolvedValue(response);
            await expect(organisationController.findOrganisationById(params)).resolves.not.toThrow();
            expect(organisationUcMock.findOrganisationById).toHaveBeenCalledTimes(1);
        });

        it('should throw an error', async () => {
            const mockError: EntityNotFoundError = new EntityNotFoundError('organization', faker.string.uuid());
            organisationUcMock.findOrganisationById.mockRejectedValue(mockError);
            await expect(organisationController.findOrganisationById(params)).rejects.toThrowError(HttpException);
            expect(organisationUcMock.findOrganisationById).toHaveBeenCalledTimes(1);
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

    describe('getRootOrganisation', () => {
        const response: OrganisationResponse = {
            id: faker.string.uuid(),
            kennung: faker.lorem.word(),
            name: faker.lorem.word(),
            namensergaenzung: faker.lorem.word(),
            kuerzel: faker.lorem.word(),
            typ: OrganisationsTyp.SONSTIGE,
        };

        it('should return the root organisation if it exists', async () => {
            organisationUcMock.findRootOrganisation.mockResolvedValue(response);
            await expect(organisationController.getRootOrganisation()).resolves.not.toThrow();
            expect(organisationUcMock.findRootOrganisation).toHaveBeenCalledTimes(1);
        });

        it('should throw an error', async () => {
            const mockError: EntityNotFoundError = new EntityNotFoundError('organization', response.id);
            organisationUcMock.findRootOrganisation.mockRejectedValue(mockError);
            await expect(organisationController.getRootOrganisation()).rejects.toThrowError(HttpException);
            expect(organisationUcMock.findRootOrganisation).toHaveBeenCalledTimes(1);
        });
    });

    describe('getVerwalteteOrganisationen', () => {
        const params: OrganisationByIdParams = {
            organisationId: faker.string.uuid(),
        };

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

            organisationUcMock.findVerwaltetVon.mockResolvedValue(mockedPagedResponse);

            const result: Paged<OrganisationResponse> =
                await organisationController.getVerwalteteOrganisationen(params);

            expect(result).toEqual(mockedPagedResponse);
            expect(organisationUcMock.findVerwaltetVon).toHaveBeenCalledTimes(1);
            expect(result.items.length).toEqual(2);
        });
    });

    describe('getZugehoerigeOrganisationen', () => {
        const params: OrganisationByIdParams = {
            organisationId: faker.string.uuid(),
        };

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

    describe('addVerwalteteOrganisation', () => {
        it('should not throw an error', async () => {
            const params: OrganisationByIdParams = {
                organisationId: faker.string.uuid(),
            };

            const body: OrganisationByIdBodyParams = {
                organisationId: faker.string.uuid(),
            };

            await expect(organisationController.addVerwalteteOrganisation(params, body)).resolves.not.toThrow();
            expect(organisationUcMock.setVerwaltetVon).toHaveBeenCalledTimes(1);
        });
    });

    describe('addZugehoerigeOrganisation', () => {
        it('should not throw an error', async () => {
            const params: OrganisationByIdParams = {
                organisationId: faker.string.uuid(),
            };

            const body: OrganisationByIdBodyParams = {
                organisationId: faker.string.uuid(),
            };

            await expect(organisationController.addZugehoerigeOrganisation(params, body)).resolves.not.toThrow();
            expect(organisationUcMock.setZugehoerigZu).toHaveBeenCalledTimes(1);
        });
    });
});
