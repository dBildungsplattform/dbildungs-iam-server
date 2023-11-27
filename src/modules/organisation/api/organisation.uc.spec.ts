import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { DomainToSchulConnexErrorMapper } from '../../../shared/error/domain-to-schulconnex-error.mapper.js';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { SchulConnexError } from '../../../shared/error/schul-connex.error.js';
import { Paged } from '../../../shared/paging/paged.js';
import { OrganisationDo } from '../domain/organisation.do.js';
import { OrganisationsTyp } from '../domain/organisation.enum.js';
import { OrganisationService } from '../domain/organisation.service.js';
import { CreateOrganisationDto } from './create-organisation.dto.js';
import { CreatedOrganisationDto } from './created-organisation.dto.js';
import { FindOrganisationDto } from './find-organisation.dto.js';
import { OrganisationApiMapperProfile } from './organisation-api.mapper.profile.js';
import { OrganisationResponse } from './organisation.response.js';
import { OrganisationUc } from './organisation.uc.js';

describe('OrganisationUc', () => {
    let module: TestingModule;
    let organisationUc: OrganisationUc;
    let organisationServiceMock: DeepMocked<OrganisationService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [MapperTestModule],
            providers: [
                OrganisationUc,
                OrganisationApiMapperProfile,
                DomainToSchulConnexErrorMapper,
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

            it('bla', () => {
                expect(EntityCouldNotBeCreated.name).toEqual(new EntityCouldNotBeCreated('').constructor.name);
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
});
