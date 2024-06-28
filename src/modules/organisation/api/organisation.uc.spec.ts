import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { SchulConnexError } from '../../../shared/error/schul-connex.error.js';
import { Paged } from '../../../shared/paging/paged.js';
import { OrganisationDo } from '../domain/organisation.do.js';
import { OrganisationsTyp } from '../domain/organisation.enums.js';
import { OrganisationService } from '../domain/organisation.service.js';
import { CreateOrganisationDto } from './create-organisation.dto.js';
import { CreatedOrganisationDto } from './created-organisation.dto.js';
import { FindOrganisationDto } from './find-organisation.dto.js';
import { OrganisationApiMapperProfile } from './organisation-api.mapper.profile.js';
import { OrganisationResponseLegacy } from './organisation.response.legacy.js';
import { OrganisationUc } from './organisation.uc.js';
import { UpdateOrganisationDto } from './update-organisation.dto.js';
import { UpdatedOrganisationDto } from './updated-organisation.dto.js';
import { EntityCouldNotBeUpdated } from '../../../shared/error/entity-could-not-be-updated.error.js';
import { OrganisationSpecificationError } from '../specification/error/organisation-specification.error.js';

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
        describe('when result is ok', () => {
            it('should create an organisation', async () => {
                organisationServiceMock.createOrganisation.mockResolvedValue({
                    ok: true,
                    value: DoFactory.createOrganisation(true),
                });
                await expect(organisationUc.createOrganisation({} as CreateOrganisationDto)).resolves.toBeInstanceOf(
                    CreatedOrganisationDto,
                );
            });
        });

        describe('when result is not ok and instance of OrganisationSpecificationError', () => {
            it('should return an error', async () => {
                organisationServiceMock.createOrganisation.mockResolvedValue({
                    ok: false,
                    error: new OrganisationSpecificationError('error', undefined),
                });
                await expect(organisationUc.createOrganisation({} as CreateOrganisationDto)).resolves.toBeInstanceOf(
                    OrganisationSpecificationError,
                );
            });
        });

        describe('when result is not ok', () => {
            it('should return an error', async () => {
                organisationServiceMock.createOrganisation.mockResolvedValue({
                    ok: false,
                    error: new EntityCouldNotBeCreated(''),
                });
                await expect(organisationUc.createOrganisation({} as CreateOrganisationDto)).resolves.toBeInstanceOf(
                    SchulConnexError,
                );
            });
        });
    });

    describe('updateOrganisation', () => {
        describe('when result is ok', () => {
            it('should update an organisation', async () => {
                organisationServiceMock.updateOrganisation.mockResolvedValue({
                    ok: true,
                    value: DoFactory.createOrganisation(true),
                });
                await expect(organisationUc.updateOrganisation({} as UpdateOrganisationDto)).resolves.toBeInstanceOf(
                    UpdatedOrganisationDto,
                );
            });
        });

        describe('when result is not ok and instance of OrganisationSpecificationError', () => {
            it('should return an error', async () => {
                organisationServiceMock.updateOrganisation.mockResolvedValue({
                    ok: false,
                    error: new OrganisationSpecificationError('error', undefined),
                });
                await expect(organisationUc.updateOrganisation({} as UpdateOrganisationDto)).resolves.toBeInstanceOf(
                    OrganisationSpecificationError,
                );
            });
        });

        describe('when result is not ok', () => {
            it('should return an error', async () => {
                organisationServiceMock.updateOrganisation.mockResolvedValue({
                    ok: false,
                    error: new EntityCouldNotBeCreated(''),
                });
                await expect(organisationUc.updateOrganisation({} as UpdateOrganisationDto)).resolves.toBeInstanceOf(
                    SchulConnexError,
                );
            });
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
            await expect(organisationUc.findOrganisationById(organisation.id)).resolves.toBeInstanceOf(
                SchulConnexError,
            );
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
            await expect(organisationUc.findRootOrganisation()).resolves.toBeInstanceOf(SchulConnexError);
        });
    });

    describe('setAdministriertVon', () => {
        it('should find the root organisation', async () => {
            organisationServiceMock.setAdministriertVon.mockResolvedValue({
                ok: true,
                value: undefined,
            });
            await expect(organisationUc.setAdministriertVon('', '')).resolves.not.toThrow();
        });

        describe('when result is not ok and instance of OrganisationSpecificationError', () => {
            it('should return an error', async () => {
                organisationServiceMock.setAdministriertVon.mockResolvedValue({
                    ok: false,
                    error: new OrganisationSpecificationError('error', undefined),
                });

                await expect(organisationUc.setAdministriertVon('', '')).resolves.toBeInstanceOf(
                    OrganisationSpecificationError,
                );
            });
        });

        describe('when result is not ok', () => {
            it('should throw an error', async () => {
                organisationServiceMock.setAdministriertVon.mockResolvedValue({
                    ok: false,
                    error: new EntityCouldNotBeUpdated('', ''),
                });

                await expect(organisationUc.setAdministriertVon('', '')).resolves.toBeInstanceOf(SchulConnexError);
            });
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

        describe('when result is not ok and instance of OrganisationSpecificationError', () => {
            it('should throw an error if result is not ok and instanceof OrganisationSpecificationError', async () => {
                organisationServiceMock.setZugehoerigZu.mockResolvedValue({
                    ok: false,
                    error: new OrganisationSpecificationError('error', undefined),
                });

                await expect(organisationUc.setZugehoerigZu('', '')).resolves.toBeInstanceOf(
                    OrganisationSpecificationError,
                );
            });
        });

        describe('when result is not ok', () => {
            it('should throw an error', async () => {
                organisationServiceMock.setZugehoerigZu.mockResolvedValue({
                    ok: false,
                    error: new EntityCouldNotBeUpdated('', ''),
                });

                await expect(organisationUc.setZugehoerigZu('', '')).resolves.toBeInstanceOf(SchulConnexError);
            });
        });
    });

    describe('findAdministriertVon', () => {
        describe('when parent organisation exists', () => {
            it('should return all found organisations', async () => {
                const organisationDos: OrganisationDo<true>[] = DoFactory.createMany(
                    2,
                    true,
                    DoFactory.createOrganisation,
                );

                organisationServiceMock.findOrganisationById.mockResolvedValueOnce({
                    ok: true,
                    value: DoFactory.createOrganisation(true),
                });

                organisationServiceMock.findAllAdministriertVon.mockResolvedValue({
                    total: organisationDos.length,
                    offset: 0,
                    limit: 0,
                    items: organisationDos,
                });

                const result: Paged<OrganisationResponseLegacy> | SchulConnexError =
                    await organisationUc.findAdministriertVon('');

                expect(result).not.toBeInstanceOf(SchulConnexError);

                if (!(result instanceof SchulConnexError)) {
                    expect(result.total).toBe(2);
                    expect(result.items).toHaveLength(2);
                    expect(result.items[0]?.name).toEqual(organisationDos[0]?.name);
                    expect(result.items[1]?.name).toEqual(organisationDos[1]?.name);
                    expect(result.items[0]?.kennung).toEqual(organisationDos[0]?.kennung);
                    expect(result.items[1]?.kennung).toEqual(organisationDos[1]?.kennung);
                    expect(result.items[0]?.typ).toEqual(organisationDos[0]?.typ);
                    expect(result.items[1]?.typ).toEqual(organisationDos[1]?.typ);
                }
            });
        });

        describe('when no parent organisation exists', () => {
            it('should throw error', async () => {
                organisationServiceMock.findOrganisationById.mockResolvedValueOnce({
                    ok: false,
                    error: new EntityNotFoundError(),
                });

                await expect(organisationUc.findAdministriertVon('')).resolves.toBeInstanceOf(SchulConnexError);
            });
        });
    });

    describe('findZugehoerigZu', () => {
        describe('when parent organisation exists', () => {
            it('should return all found organisations', async () => {
                const organisationDos: OrganisationDo<true>[] = DoFactory.createMany(
                    2,
                    true,
                    DoFactory.createOrganisation,
                );

                organisationServiceMock.findOrganisationById.mockResolvedValueOnce({
                    ok: true,
                    value: DoFactory.createOrganisation(true),
                });

                organisationServiceMock.findAllZugehoerigZu.mockResolvedValue({
                    total: organisationDos.length,
                    offset: 0,
                    limit: 0,
                    items: organisationDos,
                });

                const result: Paged<OrganisationResponseLegacy> | SchulConnexError =
                    await organisationUc.findZugehoerigZu('');

                expect(result).not.toBeInstanceOf(SchulConnexError);

                if (!(result instanceof SchulConnexError)) {
                    expect(result.total).toBe(2);
                    expect(result.items).toHaveLength(2);
                    expect(result.items[0]?.name).toEqual(organisationDos[0]?.name);
                    expect(result.items[1]?.name).toEqual(organisationDos[1]?.name);
                    expect(result.items[0]?.kennung).toEqual(organisationDos[0]?.kennung);
                    expect(result.items[1]?.kennung).toEqual(organisationDos[1]?.kennung);
                    expect(result.items[0]?.typ).toEqual(organisationDos[0]?.typ);
                    expect(result.items[1]?.typ).toEqual(organisationDos[1]?.typ);
                }
            });
        });

        describe('when no parent organisation exists', () => {
            it('should throw error', async () => {
                organisationServiceMock.findOrganisationById.mockResolvedValueOnce({
                    ok: false,
                    error: new EntityNotFoundError(),
                });

                await expect(organisationUc.findZugehoerigZu('')).resolves.toBeInstanceOf(SchulConnexError);
            });
        });
    });
});
