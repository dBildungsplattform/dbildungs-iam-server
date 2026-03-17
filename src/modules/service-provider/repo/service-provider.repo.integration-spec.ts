import { faker } from '@faker-js/faker';
import { Collection, EntityManager, MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    createPersonPermissionsMock,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DoFactory,
    expectErrResult,
    expectOkResult,
    LoggingTestModule,
} from '../../../../test/utils/index.js';
import { EventRoutingLegacyKafkaService } from '../../../core/eventbus/services/event-routing-legacy-kafka.service.js';
import { OrganisationID, RolleID } from '../../../shared/types/aggregate-ids.types.js';
import { PermittedOrgas, PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { RolleFactory } from '../../rolle/domain/rolle.factory.js';
import { RolleServiceProviderEntity } from '../../rolle/entity/rolle-service-provider.entity.js';
import { RolleEntity } from '../../rolle/entity/rolle.entity.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import {
    ServiceProviderKategorie,
    ServiceProviderMerkmal,
    ServiceProviderTarget,
} from '../domain/service-provider.enum.js';
import { ServiceProvider } from '../domain/service-provider.js';
import { ServiceProviderMerkmalEntity } from './service-provider-merkmal.entity.js';
import { ServiceProviderEntity } from './service-provider.entity.js';
import { ServiceProviderRepo } from './service-provider.repo.js';
import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { ServiceProviderInternalRepo } from './service-provider.internal.repo.js';
import { createAndPersistServiceProvider } from '../../../../test/utils/service-provider-test-helper.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { DuplicateNameError } from '../specification/error/duplicate-name.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';

describe('ServiceProviderRepo', () => {
    let module: TestingModule;
    let sut: ServiceProviderRepo;

    let orm: MikroORM;
    let em: EntityManager;
    let organisationRepo: OrganisationRepository;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true }), LoggingTestModule],
            providers: [
                ServiceProviderRepo,
                ServiceProviderInternalRepo,
                RolleRepo,
                RolleFactory,
                OrganisationRepository,
                {
                    provide: EventRoutingLegacyKafkaService,
                    useValue: createMock(EventRoutingLegacyKafkaService),
                },
                {
                    provide: RolleFactory,
                    useValue: createMock(RolleFactory),
                },
            ],
        }).compile();

        sut = module.get(ServiceProviderRepo);
        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        organisationRepo = module.get(OrganisationRepository);

        await DatabaseTestModule.setupDatabase(orm);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await orm.close();
        await module.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
        expect(em).toBeDefined();
    });

    describe('create', () => {
        it('should save new service-provider', async () => {
            const serviceProvider: ServiceProvider<false> = DoFactory.createServiceProvider(false, {
                keycloakGroup: faker.string.alphanumeric(),
                keycloakRole: faker.string.alphanumeric(),
            });
            const permissionsMock: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
            permissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

            const createResult: Result<ServiceProvider<true>, DomainError> = await sut.create(
                permissionsMock,
                serviceProvider,
            );

            expectOkResult(createResult);
            expect(createResult.value.id).toBeDefined();
        });

        it('should return error if name is already used', async () => {
            const name: string = 'Test name';
            const providedOnSchulstrukturknoten: string = faker.string.uuid();

            await createAndPersistServiceProvider(em, { name, providedOnSchulstrukturknoten });
            const serviceProvider: ServiceProvider<false> = DoFactory.createServiceProvider(false, {
                name,
                providedOnSchulstrukturknoten,
            });
            const permissionsMock: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
            permissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

            const createResult: Result<ServiceProvider<true>, DomainError> = await sut.create(
                permissionsMock,
                serviceProvider,
            );

            expectErrResult(createResult);
            expect(createResult.error).toBeInstanceOf(DuplicateNameError);
        });

        it('should set some default values if person only has limited permissions', async () => {
            const serviceProvider: ServiceProvider<false> = DoFactory.createServiceProvider(false, {
                merkmale: [],
                requires2fa: true,
                kategorie: ServiceProviderKategorie.VERWALTUNG,
            });
            const permissionsMock: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
            permissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(false); // ANGEBOTE_VERWALTEN
            permissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true); // ANGEBOTE_EINGESCHRAENKT_VERWALTEN

            const createResult: Result<ServiceProvider<true>, DomainError> = await sut.create(
                permissionsMock,
                serviceProvider,
            );

            expectOkResult(createResult);
            expect(createResult.value.id).toBeDefined();

            expect(createResult.value.merkmale).toEqual([
                ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG,
                ServiceProviderMerkmal.NACHTRAEGLICH_ZUWEISBAR,
            ]);
            expect(createResult.value.requires2fa).toBe(false);
            expect(createResult.value.kategorie).toBe(ServiceProviderKategorie.SCHULISCH);
        });

        it('return error if person is missing permissions', async () => {
            const serviceProvider: ServiceProvider<false> = DoFactory.createServiceProvider(false);
            const permissionsMock: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
            permissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(false);
            permissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(false);

            const createResult: Result<ServiceProvider<true>, DomainError> = await sut.create(
                permissionsMock,
                serviceProvider,
            );

            expectErrResult(createResult);
            expect(createResult.error).toBeInstanceOf(MissingPermissionsError);
        });
    });

    describe('update', () => {
        it('should not return duplicate name error when trying to update existing', async () => {
            const existingSp: ServiceProvider<true> = await createAndPersistServiceProvider(em);

            const permissionsMock: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
            permissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

            const updateResult: Result<ServiceProvider<true>, DomainError> = await sut.update(
                permissionsMock,
                existingSp,
            );

            expectOkResult(updateResult);
        });

        it('should return error if name is already used', async () => {
            const nameA: string = 'Test name 1';
            const nameB: string = 'Test name 2';
            const providedOnSchulstrukturknoten: string = faker.string.uuid();

            const serviceProvider: ServiceProvider<true> = await createAndPersistServiceProvider(em, {
                name: nameA,
                providedOnSchulstrukturknoten,
            });
            await createAndPersistServiceProvider(em, { name: nameB, providedOnSchulstrukturknoten });

            const permissionsMock: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
            permissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

            // Change name
            serviceProvider.name = nameB;

            const updateResult: Result<ServiceProvider<true>, DomainError> = await sut.update(
                permissionsMock,
                serviceProvider,
            );

            expectErrResult(updateResult);
            expect(updateResult.error).toBeInstanceOf(DuplicateNameError);
        });

        it('should return error serviceprovider could not be found', async () => {
            const serviceProvider: ServiceProvider<true> = DoFactory.createServiceProvider(true);

            const permissionsMock: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
            permissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

            const updateResult: Result<ServiceProvider<true>, DomainError> = await sut.update(
                permissionsMock,
                serviceProvider,
            );

            expectErrResult(updateResult);
            expect(updateResult.error).toBeInstanceOf(EntityNotFoundError);
        });

        it('should ignore changes to specific properties if person has limited permissions', async () => {
            const merkmale: ServiceProviderMerkmal[] = [ServiceProviderMerkmal.NACHTRAEGLICH_ZUWEISBAR];
            const requires2fa: boolean = true;
            const kategorie: ServiceProviderKategorie = ServiceProviderKategorie.VERWALTUNG;

            const serviceProvider: ServiceProvider<true> = await createAndPersistServiceProvider(em, {
                merkmale,
                requires2fa,
                kategorie,
            });

            const permissionsMock: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
            permissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(false); // ANGEBOTE_VERWALTEN
            permissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true); // ANGEBOTE_EINGESCHRAENKT_VERWALTEN

            serviceProvider.merkmale = [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG];
            serviceProvider.requires2fa = false;
            serviceProvider.kategorie = ServiceProviderKategorie.EMAIL;

            const updateResult: Result<ServiceProvider<true>, DomainError> = await sut.update(
                permissionsMock,
                serviceProvider,
            );

            expectOkResult(updateResult);
            expect(updateResult.value.merkmale).toEqual(merkmale);
            expect(updateResult.value.requires2fa).toEqual(requires2fa);
            expect(updateResult.value.kategorie).toEqual(kategorie);
        });

        it('return error if person is missing permissions', async () => {
            const serviceProvider: ServiceProvider<true> = DoFactory.createServiceProvider(true);
            const permissionsMock: DeepMocked<PersonPermissions> = createPersonPermissionsMock();
            permissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(false);
            permissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(false);

            const createResult: Result<ServiceProvider<true>, DomainError> = await sut.update(
                permissionsMock,
                serviceProvider,
            );

            expectErrResult(createResult);
            expect(createResult.error).toBeInstanceOf(MissingPermissionsError);
        });
    });

    describe('createUnsafe', () => {
        it('should save new service-provider', async () => {
            const serviceProvider: ServiceProvider<false> = DoFactory.createServiceProvider(false, {
                keycloakGroup: faker.string.alphanumeric(),
                keycloakRole: faker.string.alphanumeric(),
            });

            const createdSp: ServiceProvider<true> = await sut.createUnsafe(serviceProvider);

            expect(createdSp.id).toBeDefined();
        });
    });

    describe('find', () => {
        it('should return all service-provider without logo', async () => {
            const serviceProviders: ServiceProvider<true>[] = await Promise.all([
                createAndPersistServiceProvider(em),
                createAndPersistServiceProvider(em),
                createAndPersistServiceProvider(em),
            ]);
            em.clear();

            const serviceProviderResult: ServiceProvider<true>[] = await sut.find({ withLogo: false });

            expect(serviceProviderResult).toHaveLength(serviceProviders.length);
            for (const sp of serviceProviderResult) {
                expect(sp.logo).toBeUndefined();
            }
        });

        it('should return all service-provider with logo', async () => {
            const serviceProviders: ServiceProvider<true>[] = await Promise.all([
                createAndPersistServiceProvider(em),
                createAndPersistServiceProvider(em),
                createAndPersistServiceProvider(em),
            ]);
            em.clear();

            const serviceProviderResult: ServiceProvider<true>[] = await sut.find({ withLogo: true });

            expect(serviceProviderResult).toHaveLength(serviceProviders.length);
            for (const sp of serviceProviderResult) {
                expect(sp.logo).toBeInstanceOf(Buffer);
            }
        });
    });

    describe('findById', () => {
        it('should return the service-provider without logo', async () => {
            const serviceProvider: ServiceProvider<true> = await createAndPersistServiceProvider(em);
            em.clear();

            const serviceProviderResult: Option<ServiceProvider<true>> = await sut.findById(serviceProvider.id, {
                withLogo: false,
            });

            expect(serviceProviderResult).toBeDefined();
            expect(serviceProviderResult).toBeInstanceOf(ServiceProvider);
            expect(serviceProviderResult?.logo).toBeUndefined();
        });

        it('should return the service-provider with logo', async () => {
            const serviceProvider: ServiceProvider<true> = await createAndPersistServiceProvider(em);

            const serviceProviderResult: Option<ServiceProvider<true>> = await sut.findById(serviceProvider.id, {
                withLogo: true,
            });

            expect(serviceProviderResult).toBeDefined();
            expect(serviceProviderResult).toBeInstanceOf(ServiceProvider);
            expect(serviceProviderResult?.logo).toBeInstanceOf(Buffer);
        });

        it('should return undefined if the entity does not exist', async () => {
            const serviceProvider: Option<ServiceProvider<true>> = await sut.findById(faker.string.uuid(), {
                withLogo: false,
            });

            expect(serviceProvider).toBeNull();
        });
    });

    describe('findByIds', () => {
        it('should return the service-provider map', async () => {
            const serviceProvider: ServiceProvider<true> = await createAndPersistServiceProvider(em);
            const serviceProviderMap: Map<string, ServiceProvider<true>> = await sut.findByIds([serviceProvider.id]);

            expect(serviceProviderMap).toBeDefined();
        });
    });

    describe('findByOrganisationsWithMerkmale', () => {
        describe.each(['all' as const, [faker.string.uuid()]])(
            'when orgaIds is %s',
            (orgaIds: OrganisationID[] | 'all') => {
                it('should return service-providers filtered by organisations', async () => {
                    const targetOrgaId: string = orgaIds === 'all' ? faker.string.uuid() : orgaIds[0]!;

                    const serviceProviders: ServiceProvider<true>[] = await Promise.all([
                        createAndPersistServiceProvider(em, { providedOnSchulstrukturknoten: targetOrgaId }),
                        createAndPersistServiceProvider(em, {
                            providedOnSchulstrukturknoten: faker.string.uuid(),
                        }),
                    ]);

                    const [serviceProviderResult, count]: Counted<ServiceProvider<true>> =
                        await sut.findByOrganisationsWithMerkmale(orgaIds, 5, 0);

                    if (orgaIds === 'all') {
                        expect(serviceProviderResult).toHaveLength(serviceProviders.length);
                        expect(count).toEqual(serviceProviders.length);
                    } else {
                        expect(serviceProviderResult).toHaveLength(1);
                        expect(serviceProviderResult[0]!.id).toEqual(serviceProviders[0]!.id);
                        expect(count).toEqual(1);
                    }
                });
            },
        );

        it('should respect the limit and offset', async () => {
            const total: number = 10;
            await Promise.all(Array.from({ length: total }, () => createAndPersistServiceProvider(em)));

            const limit: number = 5;
            const [serviceProviderWithoutOffsetResult, countWithoutOffset]: Counted<ServiceProvider<true>> =
                await sut.findByOrganisationsWithMerkmale('all', limit, 0);
            expect(serviceProviderWithoutOffsetResult).toHaveLength(limit);
            expect(countWithoutOffset).toEqual(total);

            const [serviceProviderWithOffsetResult, countWithOffset]: Counted<ServiceProvider<true>> =
                await sut.findByOrganisationsWithMerkmale('all', limit, 5);
            expect(serviceProviderWithOffsetResult).toHaveLength(limit);
            expect(countWithOffset).toEqual(total);

            for (let index: number = 0; index < limit; index++) {
                expect(serviceProviderWithOffsetResult[index]!.id).not.toEqual(
                    serviceProviderWithoutOffsetResult[index]!.id,
                );
            }
        });

        it('should have the correct order', async () => {
            await Promise.all(
                Array.from(
                    [
                        ServiceProviderKategorie.VERWALTUNG,
                        ServiceProviderKategorie.HINWEISE,
                        ServiceProviderKategorie.EMAIL,
                        ServiceProviderKategorie.UNTERRICHT,
                    ],
                    (kategorie: ServiceProviderKategorie) => createAndPersistServiceProvider(em, { kategorie }),
                ),
            );

            const [serviceProviderResult]: Counted<ServiceProvider<true>> = await sut.findByOrganisationsWithMerkmale(
                'all',
                5,
                0,
            );

            [
                ServiceProviderKategorie.EMAIL,
                ServiceProviderKategorie.UNTERRICHT,
                ServiceProviderKategorie.VERWALTUNG,
                ServiceProviderKategorie.HINWEISE,
            ].forEach((kategorie: ServiceProviderKategorie, index: number) => {
                expect(serviceProviderResult[index]!.kategorie).toBe(kategorie);
            });
        });
    });

    describe('findByIdAuthorized', () => {
        let organisationA: Organisation<true>;
        let organisationB: Organisation<true>;
        let serviceProvider: ServiceProvider<true>;

        beforeEach(async () => {
            organisationA = await organisationRepo.save(DoFactory.createOrganisation(false));
            organisationB = await organisationRepo.save(DoFactory.createOrganisation(false));

            serviceProvider = await createAndPersistServiceProvider(em, {
                providedOnSchulstrukturknoten: organisationA.id,
                merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
            });
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should return the service provider when administriert at organisation', async () => {
            const result: Option<ServiceProvider<true>> = await sut.findByIdForOrganisationIds(serviceProvider.id, [
                organisationA.id,
            ]);

            expect(result).not.toBeNull();
            expect(result!.id).toEqual(serviceProvider.id);

            expect(result!.merkmale.length).toBeGreaterThan(0);
        });

        it('should return null when the ID exists but organisationIds do not include the provider’s org', async () => {
            const result: Option<ServiceProvider<true>> = await sut.findByIdForOrganisationIds(serviceProvider.id, [
                organisationB.id,
            ]);

            expect(result).toBeNull();
        });

        it('should return null when the service provider does not exist', async () => {
            const result: Option<ServiceProvider<true>> = await sut.findByIdForOrganisationIds(faker.string.uuid(), [
                organisationA.id,
            ]);

            expect(result).toBeNull();
        });

        it('should return null when organisationIds list is empty', async () => {
            const result: Option<ServiceProvider<true>> = await sut.findByIdForOrganisationIds(serviceProvider.id, []);

            expect(result).toBeNull();
        });

        it('should return the provider when multiple organisationIds are passed and one matches', async () => {
            const result: Option<ServiceProvider<true>> = await sut.findByIdForOrganisationIds(serviceProvider.id, [
                organisationB.id,
                organisationA.id,
            ]);

            expect(result).not.toBeNull();
            expect(result!.id).toEqual(serviceProvider.id);
        });
    });

    describe('findByOrgasWithMerkmal', () => {
        it('returns only service-providers for the given organisation ids that have the rollenerweiterung merkmal', async () => {
            const orgId: string = faker.string.uuid();

            const [persistedWithMerkmal]: ServiceProvider<true>[] = await Promise.all([
                createAndPersistServiceProvider(em, {
                    providedOnSchulstrukturknoten: orgId,
                    merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
                }),
                createAndPersistServiceProvider(em, {
                    providedOnSchulstrukturknoten: orgId,
                }),
                createAndPersistServiceProvider(em, {
                    providedOnSchulstrukturknoten: faker.string.uuid(),
                    merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
                }),
            ]);

            em.clear();

            const [result, count]: Counted<ServiceProvider<true>> = await sut.findByOrgasWithMerkmal(
                [orgId],
                ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG,
                5,
                0,
            );

            expect(count).toEqual(1);
            expect(result).toHaveLength(1);
            expect(result[0]!.id).toEqual(persistedWithMerkmal!.id);
        });

        it('respects limit and offset for results that match organisation ids and merkmal', async () => {
            const orgId: string = faker.string.uuid();
            const total: number = 10;

            await Promise.all(
                Array.from({ length: total }, () =>
                    createAndPersistServiceProvider(em, {
                        providedOnSchulstrukturknoten: orgId,
                        merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
                    }),
                ),
            );

            const limit: number = 5;
            const [withoutOffsetResult, countWithoutOffset]: Counted<ServiceProvider<true>> =
                await sut.findByOrgasWithMerkmal(
                    [orgId],
                    ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG,
                    limit,
                    0,
                );
            expect(withoutOffsetResult).toHaveLength(limit);
            expect(countWithoutOffset).toEqual(total);

            const [withOffsetResult, countWithOffset]: Counted<ServiceProvider<true>> =
                await sut.findByOrgasWithMerkmal(
                    [orgId],
                    ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG,
                    limit,
                    5,
                );
            expect(withOffsetResult).toHaveLength(limit);
            expect(countWithOffset).toEqual(total);

            for (let index: number = 0; index < limit; index++) {
                expect(withOffsetResult[index]!.id).not.toEqual(withoutOffsetResult[index]!.id);
            }
        });

        it('should have the correct order', async () => {
            const orgId: string = faker.string.uuid();
            await Promise.all(
                [
                    ServiceProviderKategorie.VERWALTUNG,
                    ServiceProviderKategorie.HINWEISE,
                    ServiceProviderKategorie.EMAIL,
                    ServiceProviderKategorie.UNTERRICHT,
                ].map((kategorie: ServiceProviderKategorie) =>
                    createAndPersistServiceProvider(em, {
                        kategorie,
                        providedOnSchulstrukturknoten: orgId,
                        merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
                    }),
                ),
            );

            const [serviceProviderResult]: Counted<ServiceProvider<true>> = await sut.findByOrgasWithMerkmal(
                [orgId],
                ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG,
                5,
                0,
            );

            [
                ServiceProviderKategorie.EMAIL,
                ServiceProviderKategorie.UNTERRICHT,
                ServiceProviderKategorie.VERWALTUNG,
                ServiceProviderKategorie.HINWEISE,
            ].forEach((kategorie: ServiceProviderKategorie, index: number) => {
                expect(serviceProviderResult[index]!.kategorie).toBe(kategorie);
            });
        });
    });

    describe('findAuthorizedById', () => {
        describe.each([
            {
                all: true,
            } as PermittedOrgas,
            {
                all: false,
                orgaIds: [faker.string.uuid()],
            } as PermittedOrgas,
        ])('when permissions are %s', (permittedOrgas: PermittedOrgas) => {
            it('should return service-provider if the user is allowed to manage it', async () => {
                const permittedOrgaIds: string[] = permittedOrgas.all ? [faker.string.uuid()] : permittedOrgas.orgaIds;

                const serviceProviders: ServiceProvider<true>[] = await Promise.all([
                    createAndPersistServiceProvider(em, { providedOnSchulstrukturknoten: permittedOrgaIds[0] }),
                    createAndPersistServiceProvider(em, { providedOnSchulstrukturknoten: faker.string.uuid() }),
                ]);

                const permissions: DeepMocked<PersonPermissions> = createMock(PersonPermissions);
                permissions.getOrgIdsWithSystemrecht = vi.fn().mockReturnValue(permittedOrgas);
                const serviceProviderResult: Option<ServiceProvider<true>> = await sut.findAuthorizedById(
                    permissions,
                    serviceProviders[0]!.id,
                );
                const otherServiceProviderResult: Option<ServiceProvider<true>> = await sut.findAuthorizedById(
                    permissions,
                    serviceProviders[1]!.id,
                );

                expect(serviceProviderResult).toBeDefined();
                expect(serviceProviderResult?.id).toBe(serviceProviders[0]!.id);
                if (permittedOrgas.all) {
                    expect(otherServiceProviderResult).toBeDefined();
                } else {
                    expect(otherServiceProviderResult).toBeNull();
                }
            });
        });
    });

    describe('findByName', () => {
        it('should find a ServiceProvider by its name if a ServiceProvider with the given name exists', async () => {
            const expectedServiceProvider: ServiceProvider<true> = await createAndPersistServiceProvider(em);

            const actualServiceProvider: Option<ServiceProvider<true>> = await sut.findByName(
                expectedServiceProvider.name,
            );

            expect(actualServiceProvider).toEqual(expectedServiceProvider);
        });

        it('should throw an error if there are no existing ServiceProviders for the given name', async () => {
            await createAndPersistServiceProvider(em);

            const result: Option<ServiceProvider<true>> = await sut.findByName('this-service-provider-does-not-exist');

            expect(result).toBeFalsy();
        });
    });

    describe('findByVidisAngebotId', () => {
        it('should find a ServiceProvider by its VIDIS Angebot ID', async () => {
            const expectedVidisAngebotId: string = '1234567';
            const expectedPersistedServiceProvider: ServiceProvider<true> = await createAndPersistServiceProvider(em, {
                vidisAngebotId: expectedVidisAngebotId,
            });
            await createAndPersistServiceProvider(em, { vidisAngebotId: '7777777' });

            const actualServiceProvider: Option<ServiceProvider<true>> =
                await sut.findByVidisAngebotId(expectedVidisAngebotId);

            expect(actualServiceProvider).toEqual(expectedPersistedServiceProvider);
        });

        it('should return null if there are no existing ServiceProviders for the given VIDIS Angebot ID', async () => {
            await createAndPersistServiceProvider(em, { vidisAngebotId: '1234567' });

            const result: Option<ServiceProvider<true>> = await sut.findByVidisAngebotId('7777777');

            expect(result).toBeFalsy();
        });
    });

    describe('findByKeycloakGroup', () => {
        it('should find a ServiceProvider by its Keycloak groupname', async () => {
            const expectedPersistedServiceProvider: ServiceProvider<true> = await createAndPersistServiceProvider(em, {
                keycloakGroup: 'keycloak-group-1',
            });
            await createAndPersistServiceProvider(em, { keycloakGroup: 'keycloak-group-2' });

            let result: ServiceProvider<true>[] = [];
            if (expectedPersistedServiceProvider.keycloakGroup) {
                result = await sut.findByKeycloakGroup(expectedPersistedServiceProvider.keycloakGroup);
            }

            expect(result).toEqual([expectedPersistedServiceProvider]);
        });
    });

    describe('findBySchulstrukturknoten', () => {
        it('should return the service provider', async () => {
            const providedOnSchulstrukturknoten: string = faker.string.uuid();
            const persistedServiceProvider: ServiceProvider<true> = await createAndPersistServiceProvider(em, {
                providedOnSchulstrukturknoten,
            });
            const result: Array<ServiceProvider<true>> =
                await sut.findBySchulstrukturknoten(providedOnSchulstrukturknoten);

            expect(result).toHaveLength(1);
            expect(result).toEqual(expect.arrayContaining([persistedServiceProvider]));
        });
    });

    describe('fetchRolleServiceProvidersWithoutPerson', () => {
        it('should define serviceProviderResult', async () => {
            const role: RolleID = faker.string.uuid();
            const serviceProviderResult: ServiceProvider<true>[] = await sut.fetchRolleServiceProvidersWithoutPerson([
                role,
            ]);
            expect(serviceProviderResult).toBeDefined();
        });

        it('should correctly map RolleServiceProviderEntity to ServiceProvider', async () => {
            // Arrange
            const roleId: RolleID = faker.string.uuid();

            const serviceProviderEntityMock: ServiceProviderEntity = createMock(ServiceProviderEntity, {
                id: faker.string.uuid(),
                name: faker.company.name(),
                target: ServiceProviderTarget.SCHULPORTAL_ADMINISTRATION,
                providedOnSchulstrukturknoten: faker.string.uuid(),
                kategorie: ServiceProviderKategorie.VERWALTUNG,
            });

            serviceProviderEntityMock.merkmale = {
                map: () => [
                    {
                        merkmal: ServiceProviderMerkmal.NACHTRAEGLICH_ZUWEISBAR,
                    } as ServiceProviderMerkmalEntity,
                ],
            } as unknown as Collection<ServiceProviderMerkmalEntity>;

            const rolleServiceProviderEntityMock: RolleServiceProviderEntity = {
                rolle: { id: roleId } as RolleEntity,
                serviceProvider: serviceProviderEntityMock,
            } as RolleServiceProviderEntity;

            vi.spyOn(em, 'find').mockResolvedValue([rolleServiceProviderEntityMock]);

            const result: ServiceProvider<true>[] = await sut.fetchRolleServiceProvidersWithoutPerson(roleId);

            expect(result).toBeDefined();
            expect(em.find).toHaveBeenCalledWith(
                RolleServiceProviderEntity,
                { rolle: { id: roleId } },
                { populate: ['serviceProvider', 'serviceProvider.merkmale', 'rolle', 'rolle.personenKontexte'] },
            );
        });
    });

    describe('deleteById', () => {
        it('should delete an existing ServiceProvider by its id', async () => {
            const persistedPersistedServiceProvider: ServiceProvider<true> = await createAndPersistServiceProvider(em);

            const result: boolean = await sut.deleteById(persistedPersistedServiceProvider.id);

            expect(result).toBeTruthy();
        });
    });

    describe('deleteByName', () => {
        it('should delete an existing ServiceProvider by its name', async () => {
            const persistedPersistedServiceProvider: ServiceProvider<true> = await createAndPersistServiceProvider(em);

            const result: boolean = await sut.deleteByName(persistedPersistedServiceProvider.name);

            expect(result).toBeTruthy();
        });
    });
});
