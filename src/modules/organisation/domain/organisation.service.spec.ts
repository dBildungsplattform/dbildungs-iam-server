import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Dictionary } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { EntityCouldNotBeUpdated } from '../../../shared/error/index.js';
import { Paged } from '../../../shared/paging/index.js';
import { OrganisationService } from './organisation.service.js';
import { OrganisationsTyp } from './organisation.enums.js';
import { KennungRequiredForSchuleError } from '../specification/error/kennung-required-for-schule.error.js';
import { NameRequiredForSchuleError } from '../specification/error/name-required-for-schule.error.js';
import { SchuleKennungEindeutigError } from '../specification/error/schule-kennung-eindeutig.error.js';
import { OrganisationRepository } from '../persistence/organisation.repository.js';
import { Organisation } from './organisation.js';

describe('OrganisationService', () => {
    let module: TestingModule;
    let organisationService: OrganisationService;
    let OrganisationRepositoryMock: DeepMocked<OrganisationRepository>;
    let mapperMock: DeepMocked<Mapper>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule],
            providers: [
                OrganisationService,
                {
                    provide: OrganisationRepository,
                    useValue: createMock<OrganisationRepository>(),
                },
                {
                    provide: getMapperToken(),
                    useValue: createMock<Mapper>(),
                },
            ],
        }).compile();
        organisationService = module.get(OrganisationService);
        OrganisationRepositoryMock = module.get(OrganisationRepository);
        mapperMock = module.get(getMapperToken());
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(organisationService).toBeDefined();
    });

    describe('createOrganisation', () => {
        it('should create an organisation', async () => {
            const organisation: Organisation<false> = DoFactory.createOrganisation(false);
            OrganisationRepositoryMock.save.mockResolvedValue(organisation as unknown as Organisation<true>);
            mapperMock.map.mockReturnValue(organisation as unknown as Dictionary<unknown>);
            const result: Result<Organisation<true>> = await organisationService.createOrganisation(organisation);
            expect(result).toEqual<Result<Organisation<true>>>({
                ok: true,
                value: organisation as unknown as Organisation<true>,
            });
        });

        it('should return a domain error if first parent organisation does not exist', async () => {
            const organisation: Organisation<false> = DoFactory.createOrganisation(false);
            organisation.administriertVon = faker.string.uuid();
            OrganisationRepositoryMock.exists.mockResolvedValueOnce(false);

            const result: Result<Organisation<true>> = await organisationService.createOrganisation(organisation);

            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new EntityNotFoundError('Organisation', organisation.administriertVon),
            });
        });

        it('should return a domain error if second parent organisation does not exist', async () => {
            const organisation: Organisation<false> = DoFactory.createOrganisation(false);
            organisation.zugehoerigZu = faker.string.uuid();
            OrganisationRepositoryMock.exists.mockResolvedValueOnce(false);

            const result: Result<Organisation<true>> = await organisationService.createOrganisation(organisation);

            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new EntityNotFoundError('Organisation', organisation.zugehoerigZu),
            });
        });

        it('should return a domain error if kennung is not set and type is schule', async () => {
            const organisation: Organisation<false> = DoFactory.createOrganisation(false, {
                typ: OrganisationsTyp.SCHULE,
                kennung: undefined,
            });
            OrganisationRepositoryMock.save.mockResolvedValue(organisation as unknown as Organisation<true>);
            mapperMock.map.mockReturnValue(organisation as unknown as Dictionary<unknown>);

            const result: Result<Organisation<true>> = await organisationService.createOrganisation(organisation);

            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new KennungRequiredForSchuleError(),
            });
        });

        it('should return a domain error if name is not set and type is schule', async () => {
            const organisation: Organisation<false> = DoFactory.createOrganisation(false, {
                typ: OrganisationsTyp.SCHULE,
                kennung: '1234567',
                name: undefined,
            });
            OrganisationRepositoryMock.save.mockResolvedValue(organisation as unknown as Organisation<true>);
            mapperMock.map.mockReturnValue(organisation as unknown as Dictionary<unknown>);

            const result: Result<Organisation<true>> = await organisationService.createOrganisation(organisation);

            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new NameRequiredForSchuleError(),
            });
        });

        it('should return a domain error if kennung is not unique and type is schule', async () => {
            const name: string = faker.string.alpha();
            const kennung: string = faker.string.numeric({ length: 7 });
            const organisation: Organisation<false> = DoFactory.createOrganisation(false, {
                typ: OrganisationsTyp.SCHULE,
                kennung: kennung,
                name: name,
            });
            const counted: Counted<Organisation<true>> = [
                [
                    DoFactory.createOrganisation(true, {
                        typ: OrganisationsTyp.SCHULE,
                        kennung: kennung,
                        name: name,
                    }),
                ],
                1,
            ];
            OrganisationRepositoryMock.findBy.mockResolvedValueOnce(counted);
            OrganisationRepositoryMock.save.mockResolvedValue(organisation as unknown as Organisation<true>);
            mapperMock.map.mockReturnValue(organisation as unknown as Dictionary<unknown>);

            const result: Result<Organisation<true>> = await organisationService.createOrganisation(organisation);

            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new SchuleKennungEindeutigError(),
            });
        });

        it('should return a domain error', async () => {
            const organisation: Organisation<false> = DoFactory.createOrganisation(false);
            organisation.id = faker.string.uuid();
            const result: Result<Organisation<true>> = await organisationService.createOrganisation(organisation);
            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new EntityCouldNotBeCreated(`Organization could not be created`),
            });
        });
    });

    describe('updateOrganisation', () => {
        it('should update an organisation', async () => {
            const organisation: Organisation<true> = DoFactory.createOrganisation(true);
            OrganisationRepositoryMock.save.mockResolvedValue(organisation as unknown as Organisation<true>);
            const result: Result<Organisation<true>> = await organisationService.updateOrganisation(organisation);
            expect(result).toEqual<Result<Organisation<true>>>({
                ok: true,
                value: organisation as unknown as Organisation<true>,
            });
        });

        it('should return a domain error', async () => {
            const organisation: Organisation<true> = DoFactory.createOrganisation(true);
            organisation.id = '';
            OrganisationRepositoryMock.findById.mockResolvedValue({} as Option<Organisation<true>>);
            const result: Result<Organisation<true>> = await organisationService.updateOrganisation(organisation);
            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new EntityCouldNotBeUpdated(`Organization could not be updated`, organisation.id),
            });
        });

        it('should return a domain error if kennung is not set and type is schule', async () => {
            const organisation: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.SCHULE,
                kennung: undefined,
            });
            OrganisationRepositoryMock.findById.mockResolvedValue(organisation as unknown as Organisation<true>);

            const result: Result<Organisation<true>> = await organisationService.updateOrganisation(organisation);

            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new KennungRequiredForSchuleError(),
            });
        });

        it('should return a domain error if name is not set and type is schule', async () => {
            const organisation: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.SCHULE,
                kennung: '1234567',
                name: undefined,
            });
            OrganisationRepositoryMock.findById.mockResolvedValue(organisation as unknown as Organisation<true>);

            const result: Result<Organisation<true>> = await organisationService.updateOrganisation(organisation);

            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new NameRequiredForSchuleError(),
            });
        });

        it('should return a domain error if kennung is not unique and type is schule', async () => {
            const name: string = faker.string.alpha();
            const kennung: string = faker.string.numeric({ length: 7 });
            const organisation: Organisation<true> = DoFactory.createOrganisation(true, {
                typ: OrganisationsTyp.SCHULE,
                kennung: kennung,
                name: name,
            });
            const counted: Counted<Organisation<true>> = [[organisation], 1];
            OrganisationRepositoryMock.findById.mockResolvedValue(organisation as unknown as Organisation<true>);
            OrganisationRepositoryMock.findBy.mockResolvedValueOnce(counted);
            OrganisationRepositoryMock.save.mockResolvedValue(organisation as unknown as Organisation<true>);
            mapperMock.map.mockReturnValue(organisation as unknown as Dictionary<unknown>);

            const result: Result<Organisation<true>> = await organisationService.updateOrganisation(organisation);

            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new SchuleKennungEindeutigError(),
            });
        });

        it('should return a domain error when organisation cannot be found on update', async () => {
            const organisation: Organisation<true> = DoFactory.createOrganisation(true);
            OrganisationRepositoryMock.findById.mockResolvedValue(undefined);
            const result: Result<Organisation<true>> = await organisationService.updateOrganisation(organisation);
            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new EntityNotFoundError('Organisation', organisation.id),
            });
        });
    });

    describe('findOrganisationById', () => {
        it('should find an organization by its ID', async () => {
            const organisation: Organisation<true> = DoFactory.createOrganisation(true);
            OrganisationRepositoryMock.findById.mockResolvedValue(organisation);
            const result: Result<Organisation<true>> = await organisationService.findOrganisationById(organisation.id);
            expect(result).toEqual<Result<Organisation<true>>>({
                ok: true,
                value: organisation,
            });
        });

        it('should return a domain error', async () => {
            OrganisationRepositoryMock.findById.mockResolvedValue(null);
            const organisationId: string = faker.string.uuid();
            const result: Result<Organisation<true>> = await organisationService.findOrganisationById(organisationId);
            expect(result).toEqual<Result<Organisation<true>>>({
                ok: false,
                error: new EntityNotFoundError('Organization', organisationId),
            });
        });
    });

    describe('findAllOrganizations', () => {
        describe('when organizations are found', () => {
            it('should return all organizations', async () => {
                const organisation: Organisation<true> = DoFactory.createOrganisation(true);
                const organisations: Organisation<true>[] = [organisation];
                const total: number = organisations.length;

                OrganisationRepositoryMock.findBy.mockResolvedValue([organisations, total]);

                const result: Paged<Organisation<true>> = await organisationService.findAllOrganizations(organisation);

                expect(result).toEqual({
                    total: total,
                    offset: 0,
                    limit: total,
                    items: organisations,
                });
            });
        });

        describe('when no organizations are found', () => {
            it('should return an empty list of organizations', async () => {
                const organisation: Organisation<false> = DoFactory.createOrganisation(false);

                OrganisationRepositoryMock.findBy.mockResolvedValue([[], 0]);

                const result: Paged<Organisation<true>> = await organisationService.findAllOrganizations(organisation);

                expect(result.items).toHaveLength(0);
                expect(result.items).toBeInstanceOf(Array);
            });
        });
    });

    describe('setAdministriertVon', () => {
        it('should return a domain error if parent organisation does not exist', async () => {
            const parentId: string = faker.string.uuid();
            const childId: string = faker.string.uuid();
            OrganisationRepositoryMock.exists.mockResolvedValueOnce(false);

            const result: Result<void> = await organisationService.setAdministriertVon(parentId, childId);

            expect(result).toEqual<Result<void>>({
                ok: false,
                error: new EntityNotFoundError('Organisation', parentId),
            });
        });

        it('should return a domain error if child organisation does not exist', async () => {
            const parentId: string = faker.string.uuid();
            const childId: string = faker.string.uuid();
            OrganisationRepositoryMock.exists.mockResolvedValueOnce(true);
            OrganisationRepositoryMock.findById.mockResolvedValueOnce(undefined);

            const result: Result<void> = await organisationService.setAdministriertVon(parentId, childId);

            expect(result).toEqual<Result<void>>({
                ok: false,
                error: new EntityNotFoundError('Organisation', childId),
            });
        });

        it('should return a domain error if the organisation could not be updated', async () => {
            const rootDo: Organisation<true> = DoFactory.createOrganisation(true, {
                id: '1',
                name: 'Root',
                administriertVon: undefined,
                zugehoerigZu: undefined,
                typ: OrganisationsTyp.TRAEGER,
            });
            const traegerDo: Organisation<true> = DoFactory.createOrganisation(true, {
                id: '2',
                name: 'Träger1',
                administriertVon: '1',
                zugehoerigZu: '1',
                typ: OrganisationsTyp.TRAEGER,
            });

            OrganisationRepositoryMock.exists.mockResolvedValueOnce(true);
            OrganisationRepositoryMock.findById.mockResolvedValueOnce(traegerDo);
            OrganisationRepositoryMock.findById.mockResolvedValueOnce(rootDo); //called in TraegerAdministriertVonTraeger
            OrganisationRepositoryMock.findById.mockResolvedValueOnce(rootDo); //called in ZyklusInAdministriertVon

            OrganisationRepositoryMock.save.mockRejectedValueOnce(new Error());
            const result: Result<void> = await organisationService.setAdministriertVon(rootDo.id, traegerDo.id);

            expect(result).toEqual<Result<void>>({
                ok: false,
                error: new EntityCouldNotBeUpdated('Organisation', traegerDo.id),
            });
        });
    });

    describe('setZugehoerigZu', () => {
        it('should return a domain error if parent organisation does not exist', async () => {
            const parentId: string = faker.string.uuid();
            const childId: string = faker.string.uuid();
            OrganisationRepositoryMock.exists.mockResolvedValueOnce(false);

            const result: Result<void> = await organisationService.setZugehoerigZu(parentId, childId);

            expect(result).toEqual<Result<void>>({
                ok: false,
                error: new EntityNotFoundError('Organisation', parentId),
            });
        });

        it('should return a domain error if child organisation does not exist', async () => {
            const parentId: string = faker.string.uuid();
            const childId: string = faker.string.uuid();
            OrganisationRepositoryMock.exists.mockResolvedValueOnce(true);
            OrganisationRepositoryMock.findById.mockResolvedValueOnce(undefined);

            const result: Result<void> = await organisationService.setZugehoerigZu(parentId, childId);

            expect(result).toEqual<Result<void>>({
                ok: false,
                error: new EntityNotFoundError('Organisation', childId),
            });
        });

        it('should return a domain error if the organisation could not be updated', async () => {
            const rootDo: Organisation<true> = DoFactory.createOrganisation(true, {
                id: '1',
                name: 'Root',
                administriertVon: undefined,
                zugehoerigZu: undefined,
                typ: OrganisationsTyp.TRAEGER,
            });
            const traegerDo: Organisation<true> = DoFactory.createOrganisation(true, {
                id: '2',
                name: 'Träger1',
                administriertVon: '1',
                zugehoerigZu: '1',
                typ: OrganisationsTyp.TRAEGER,
            });

            OrganisationRepositoryMock.exists.mockResolvedValueOnce(true);
            OrganisationRepositoryMock.findById.mockResolvedValueOnce(traegerDo);
            OrganisationRepositoryMock.findById.mockResolvedValueOnce(rootDo); //called in TraegerAdministriertVonTraeger
            OrganisationRepositoryMock.findById.mockResolvedValueOnce(rootDo); //called in ZyklusInZugehoerigZu

            OrganisationRepositoryMock.save.mockRejectedValueOnce(new Error());
            const result: Result<void> = await organisationService.setZugehoerigZu(rootDo.id, traegerDo.id);

            expect(result).toEqual<Result<void>>({
                ok: false,
                error: new EntityCouldNotBeUpdated('Organisation', traegerDo.id),
            });
        });

        it('should return domain error if the organisation could not be updated', async () => {
            const rootDo: Organisation<true> = DoFactory.createOrganisation(true, {
                id: '1',
                name: 'Root',
                administriertVon: undefined,
                zugehoerigZu: undefined,
                typ: OrganisationsTyp.TRAEGER,
            });
            const traegerDo: Organisation<true> = DoFactory.createOrganisation(true, {
                id: '2',
                name: 'Träger1',
                administriertVon: '1',
                zugehoerigZu: '1',
                typ: OrganisationsTyp.TRAEGER,
            });

            OrganisationRepositoryMock.exists.mockResolvedValueOnce(true);
            OrganisationRepositoryMock.findById.mockResolvedValueOnce(traegerDo);
            OrganisationRepositoryMock.findById.mockResolvedValueOnce(rootDo); //called in TraegerAdministriertVonTraeger
            OrganisationRepositoryMock.findById.mockResolvedValueOnce(rootDo); //called in ZyklusInZugehoerigZu

            OrganisationRepositoryMock.save.mockRejectedValueOnce(new Error());
            const result: Result<void> = await organisationService.setZugehoerigZu(rootDo.id, traegerDo.id);

            expect(result).toEqual<Result<void>>({
                ok: false,
                error: new EntityCouldNotBeUpdated('Organisation', traegerDo.id),
            });
        });
    });

    describe('findAllAdministriertVon', () => {
        describe('when organizations are found', () => {
            it('should return all organizations', async () => {
                const parentId: string = faker.string.uuid();
                const organisation: Organisation<true> = DoFactory.createOrganisation(true);
                const organisations: Organisation<true>[] = [organisation];
                const total: number = organisations.length;

                OrganisationRepositoryMock.findBy.mockResolvedValue([organisations, total]);

                const result: Paged<Organisation<true>> = await organisationService.findAllAdministriertVon(parentId);

                expect(result).toEqual({
                    total: total,
                    offset: 0,
                    limit: total,
                    items: organisations,
                });
            });
        });

        describe('when no organizations are found', () => {
            it('should return an empty list of organizations', async () => {
                const parentId: string = faker.string.uuid();
                OrganisationRepositoryMock.findBy.mockResolvedValue([[], 0]);

                const result: Paged<Organisation<true>> = await organisationService.findAllAdministriertVon(parentId);

                expect(result.items).toHaveLength(0);
                expect(result.items).toBeInstanceOf(Array);
            });
        });
    });

    describe('findAllZugehoerigZu', () => {
        describe('when organizations are found', () => {
            it('should return all organizations', async () => {
                const parentId: string = faker.string.uuid();
                const organisation: Organisation<true> = DoFactory.createOrganisation(true);
                const organisations: Organisation<true>[] = [organisation];
                const total: number = organisations.length;

                OrganisationRepositoryMock.findBy.mockResolvedValue([organisations, total]);

                const result: Paged<Organisation<true>> = await organisationService.findAllZugehoerigZu(parentId);

                expect(result).toEqual({
                    total: total,
                    offset: 0,
                    limit: total,
                    items: organisations,
                });
            });
        });

        describe('when no organizations are found', () => {
            it('should return an empty list of organizations', async () => {
                const parentId: string = faker.string.uuid();
                OrganisationRepositoryMock.findBy.mockResolvedValue([[], 0]);

                const result: Paged<Organisation<true>> = await organisationService.findAllZugehoerigZu(parentId);

                expect(result.items).toHaveLength(0);
                expect(result.items).toBeInstanceOf(Array);
            });
        });
    });
});
