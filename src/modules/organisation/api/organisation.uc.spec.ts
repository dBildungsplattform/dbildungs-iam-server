import { Test, TestingModule } from '@nestjs/testing';
import { OrganisationUc } from './organisation.uc.js';
import { OrganisationService } from '../domain/organisation.service.js';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { OrganisationApiMapperProfile } from './organisation-api.mapper.profile.js';
import { CreateOrganisationDto } from './create-organisation.dto.js';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { OrganisationDo } from '../domain/organisation.do.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { OrganisationsTyp } from '../domain/organisation.enum.js';
import { FindOrganisationDto } from './find-organisation.dto.js';
import { OrganisationResponse } from './organisation.response.js';
import { Paged } from '../../../shared/paging/paged.js';

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

        describe('when query params are given', () => {
            it('should find all organizations that match', async () => {
                const firstOrganisation: OrganisationDo<true> = DoFactory.createOrganisation(true);
                const secondOrganisation: OrganisationDo<true> = DoFactory.createOrganisation(true);

                organisationServiceMock.findAllOrganizations.mockResolvedValue({
                    total: 2,
                    offset: 0,
                    limit: 0,
                    items: [firstOrganisation, secondOrganisation],
                });

                const result: Paged<OrganisationResponse> = await organisationUc.findAll(findOrganisationDto);

                expect(result.total).toBe(2);
                expect(result.items).toHaveLength(2);
                expect(result.items[0]?.name).toEqual(firstOrganisation.name);
                expect(result.items[1]?.name).toEqual(secondOrganisation.name);
                expect(result.items[0]?.kennung).toEqual(firstOrganisation.kennung);
                expect(result.items[1]?.kennung).toEqual(secondOrganisation.kennung);
                expect(result.items[0]?.typ).toEqual(firstOrganisation.typ);
                expect(result.items[1]?.typ).toEqual(secondOrganisation.typ);
            });
        });

        describe('when no- matching organizations were found', () => {
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
