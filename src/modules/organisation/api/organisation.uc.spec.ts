import { Test, TestingModule } from '@nestjs/testing';
import { OrganisationUc } from './organisation.uc.js';
import { OrganisationService } from '../domain/organisation.service.js';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { ConfigTestModule, DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { OrganisationApiMapperProfile } from './organisation-api.mapper.profile.js';
import { CreateOrganisationDto } from './create-organisation.dto.js';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { OrganisationDo } from '../domain/organisation.do.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { OrganisationsTyp } from '../domain/organisation.enum.js';
import { FindOrganisationDto } from './find-organisation.dto.js';
import { OrganisationResponse } from './organisation.response.js';
import { Paged } from '../../../shared/paging/paged.js';
import { EntityCouldNotBeUpdated } from '../../../shared/error/entity-could-not-be-updated.error.js';

describe('OrganisationUc', () => {
    let module: TestingModule;
    let organisationUc: OrganisationUc;
    let organisationServiceMock: DeepMocked<OrganisationService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule, ConfigTestModule],
            providers: [
                OrganisationUc,
                OrganisationApiMapperProfile,
                {
                    provide: OrganisationService,
                    useValue: createMock<OrganisationService>(),
                },
            ],
        }).compile();
        organisationUc = module.get(OrganisationUc);
        organisationServiceMock = module.get(OrganisationService);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(organisationUc).toBeDefined();
    });

    describe('createOrganisation', () => {
        it('should create an organisation', async () => {
            organisationServiceMock.createOrganisation.mockResolvedValue({
                ok: true,
                value: DoFactory.createOrganisation(true),
            });
            await expect(organisationUc.createOrganisation({} as CreateOrganisationDto)).resolves.not.toThrow();
        });

        it('should throw an error', async () => {
            organisationServiceMock.createOrganisation.mockResolvedValue({
                ok: false,
                error: new EntityCouldNotBeCreated(''),
            });
            await expect(organisationUc.createOrganisation({} as CreateOrganisationDto)).rejects.toThrowError(
                EntityCouldNotBeCreated,
            );
        });
    });

    describe('findOrganisationById', () => {
        it('should find an organisation by its id', async () => {
            const organisation: OrganisationDo<true> = DoFactory.createOrganisation(true);
            organisationServiceMock.findOrganisationById.mockResolvedValue({
                ok: true,
                value: organisation,
            });
            await expect(organisationUc.findOrganisationById(organisation.id)).resolves.not.toThrow();
        });

        it('should throw an error', async () => {
            const organisation: OrganisationDo<true> = DoFactory.createOrganisation(true);
            organisationServiceMock.findOrganisationById.mockResolvedValue({
                ok: false,
                error: new EntityNotFoundError(''),
            });
            await expect(organisationUc.findOrganisationById(organisation.id)).rejects.toThrowError(
                EntityNotFoundError,
            );
        });
    });

    describe('findAll', () => {
        const findOrganisationDto: FindOrganisationDto = {
            kennung: 'kennung',
            name: 'name',
            typ: OrganisationsTyp.SCHULE,
            offset: 0,
            limit: 0,
        };

        describe('when matching organizations were found', () => {
            it('should return all found organisations', async () => {
                const organisationDos: OrganisationDo<true>[] = DoFactory.createMany(
                    2,
                    true,
                    DoFactory.createOrganisation,
                );

                organisationServiceMock.findAllOrganizations.mockResolvedValue({
                    total: 2,
                    offset: 0,
                    limit: 0,
                    items: organisationDos,
                });

                const result: Paged<OrganisationResponse> = await organisationUc.findAll(findOrganisationDto);

                expect(result.total).toBe(2);
                expect(result.items).toHaveLength(2);
                expect(result.items[0]?.name).toEqual(organisationDos[0]?.name);
                expect(result.items[1]?.name).toEqual(organisationDos[1]?.name);
                expect(result.items[0]?.kennung).toEqual(organisationDos[0]?.kennung);
                expect(result.items[1]?.kennung).toEqual(organisationDos[1]?.kennung);
                expect(result.items[0]?.typ).toEqual(organisationDos[0]?.typ);
                expect(result.items[1]?.typ).toEqual(organisationDos[1]?.typ);
            });
        });

        describe('when no matching organisations were found', () => {
            it('should return an empty array', async () => {
                organisationServiceMock.findAllOrganizations.mockResolvedValue({
                    total: 0,
                    offset: 0,
                    limit: 0,
                    items: [],
                });

                const emptyResult: Paged<OrganisationResponse> = await organisationUc.findAll(findOrganisationDto);

                expect(emptyResult.total).toBe(0);
                expect(emptyResult.items).toHaveLength(0);
            });
        });
    });

    describe('findRootOrganisation', () => {
        it('should find the root organisation', async () => {
            const organisation: OrganisationDo<true> = DoFactory.createOrganisation(true);
            organisationServiceMock.findOrganisationById.mockResolvedValue({
                ok: true,
                value: organisation,
            });
            await expect(organisationUc.findRootOrganisation()).resolves.not.toThrow();
        });

        it('should throw an error', async () => {
            organisationServiceMock.findOrganisationById.mockResolvedValue({
                ok: false,
                error: new EntityNotFoundError(''),
            });
            await expect(organisationUc.findRootOrganisation()).rejects.toThrow(EntityNotFoundError);
        });
    });

    describe('setVerwaltetVon', () => {
        it('should find the root organisation', async () => {
            organisationServiceMock.setVerwaltetVon.mockResolvedValue({
                ok: true,
                value: undefined,
            });
            await expect(organisationUc.setVerwaltetVon('', '')).resolves.not.toThrow();
        });

        it('should throw an error', async () => {
            organisationServiceMock.setVerwaltetVon.mockResolvedValue({
                ok: false,
                error: new EntityCouldNotBeUpdated('', ''),
            });
            await expect(organisationUc.setVerwaltetVon('', '')).rejects.toThrow(EntityCouldNotBeUpdated);
        });
    });

    describe('setZugehoerigZu', () => {
        it('should find the root organisation', async () => {
            organisationServiceMock.setZugehoerigZu.mockResolvedValue({
                ok: true,
                value: undefined,
            });
            await expect(organisationUc.setZugehoerigZu('', '')).resolves.not.toThrow();
        });

        it('should throw an error', async () => {
            organisationServiceMock.setZugehoerigZu.mockResolvedValue({
                ok: false,
                error: new EntityCouldNotBeUpdated('', ''),
            });
            await expect(organisationUc.setZugehoerigZu('', '')).rejects.toThrow(EntityCouldNotBeUpdated);
        });
    });

    describe('findVerwaltetVon', () => {
        describe('when matching organizations were found', () => {
            it('should return all found organisations', async () => {
                const organisationDos: OrganisationDo<true>[] = DoFactory.createMany(
                    2,
                    true,
                    DoFactory.createOrganisation,
                );

                organisationServiceMock.findAllVerwaltetVon.mockResolvedValue({
                    total: organisationDos.length,
                    offset: 0,
                    limit: 0,
                    items: organisationDos,
                });

                const result: Paged<OrganisationResponse> = await organisationUc.findVerwaltetVon('');

                expect(result.total).toBe(2);
                expect(result.items).toHaveLength(2);
                expect(result.items[0]?.name).toEqual(organisationDos[0]?.name);
                expect(result.items[1]?.name).toEqual(organisationDos[1]?.name);
                expect(result.items[0]?.kennung).toEqual(organisationDos[0]?.kennung);
                expect(result.items[1]?.kennung).toEqual(organisationDos[1]?.kennung);
                expect(result.items[0]?.typ).toEqual(organisationDos[0]?.typ);
                expect(result.items[1]?.typ).toEqual(organisationDos[1]?.typ);
            });
        });

        describe('when no matching organisations were found', () => {
            it('should return an empty array', async () => {
                organisationServiceMock.findAllVerwaltetVon.mockResolvedValue({
                    total: 0,
                    offset: 0,
                    limit: 0,
                    items: [],
                });

                const emptyResult: Paged<OrganisationResponse> = await organisationUc.findVerwaltetVon('');

                expect(emptyResult.total).toBe(0);
                expect(emptyResult.items).toHaveLength(0);
            });
        });
    });

    describe('findZugehoerigZu', () => {
        describe('when matching organizations were found', () => {
            it('should return all found organisations', async () => {
                const organisationDos: OrganisationDo<true>[] = DoFactory.createMany(
                    2,
                    true,
                    DoFactory.createOrganisation,
                );

                organisationServiceMock.findAllZugehoerigZu.mockResolvedValue({
                    total: organisationDos.length,
                    offset: 0,
                    limit: 0,
                    items: organisationDos,
                });

                const result: Paged<OrganisationResponse> = await organisationUc.findZugehoerigZu('');

                expect(result.total).toBe(2);
                expect(result.items).toHaveLength(2);
                expect(result.items[0]?.name).toEqual(organisationDos[0]?.name);
                expect(result.items[1]?.name).toEqual(organisationDos[1]?.name);
                expect(result.items[0]?.kennung).toEqual(organisationDos[0]?.kennung);
                expect(result.items[1]?.kennung).toEqual(organisationDos[1]?.kennung);
                expect(result.items[0]?.typ).toEqual(organisationDos[0]?.typ);
                expect(result.items[1]?.typ).toEqual(organisationDos[1]?.typ);
            });
        });

        describe('when no matching organisations were found', () => {
            it('should return an empty array', async () => {
                organisationServiceMock.findAllZugehoerigZu.mockResolvedValue({
                    total: 0,
                    offset: 0,
                    limit: 0,
                    items: [],
                });

                const emptyResult: Paged<OrganisationResponse> = await organisationUc.findZugehoerigZu('');

                expect(emptyResult.total).toBe(0);
                expect(emptyResult.items).toHaveLength(0);
            });
        });
    });
});
