import { faker } from '@faker-js/faker';
import { Collection, EntityManager, MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DoFactory,
    LoggingTestModule,
} from '../../../../test/utils/index.js';
import { EventRoutingLegacyKafkaService } from '../../../core/eventbus/services/event-routing-legacy-kafka.service.js';
import { RolleID } from '../../../shared/types/aggregate-ids.types.js';
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

describe('ServiceProviderRepo', () => {
    let module: TestingModule;
    let sut: ServiceProviderRepo;

    let orm: MikroORM;
    let em: EntityManager;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true }), LoggingTestModule],
            providers: [
                ServiceProviderRepo,
                RolleRepo,
                RolleFactory,
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

    describe('save', () => {
        it('should save new service-provider', async () => {
            const serviceProvider: ServiceProvider<false> = DoFactory.createServiceProvider(false);
            serviceProvider.merkmale = [ServiceProviderMerkmal.NACHTRAEGLICH_ZUWEISBAR];

            const savedServiceProvider: ServiceProvider<true> = await sut.save(serviceProvider);

            expect(savedServiceProvider.id).toBeDefined();
        });

        it('should update an existing service-provider', async () => {
            const existingServiceProvider: ServiceProvider<true> = await sut.save(
                DoFactory.createServiceProvider(false),
            );
            const update: ServiceProvider<false> = DoFactory.createServiceProvider(false);
            update.id = existingServiceProvider.id;

            const savedServiceProvider: ServiceProvider<true> = await sut.save(existingServiceProvider);

            expect(savedServiceProvider).toEqual(existingServiceProvider);
        });
        it('should publish an event when a new service-provider is saved', async () => {
            const serviceProvider: ServiceProvider<false> = DoFactory.createServiceProvider(false);

            serviceProvider.keycloakGroup = 'someGroup';
            serviceProvider.keycloakRole = 'someRole';

            const mockEventService: EventRoutingLegacyKafkaService =
                module.get<EventRoutingLegacyKafkaService>(EventRoutingLegacyKafkaService);

            await sut.save(serviceProvider);

            expect(mockEventService.publish).toHaveBeenCalledTimes(1);
        });
    });

    describe('find', () => {
        it('should return all service-provider without logo', async () => {
            const serviceProviders: ServiceProvider<true>[] = await Promise.all([
                sut.save(DoFactory.createServiceProvider(false)),
                sut.save(DoFactory.createServiceProvider(false)),
                sut.save(DoFactory.createServiceProvider(false)),
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
                sut.save(DoFactory.createServiceProvider(false)),
                sut.save(DoFactory.createServiceProvider(false)),
                sut.save(DoFactory.createServiceProvider(false)),
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
            const serviceProvider: ServiceProvider<true> = await sut.save(DoFactory.createServiceProvider(false));
            em.clear();

            const serviceProviderResult: Option<ServiceProvider<true>> = await sut.findById(serviceProvider.id, {
                withLogo: false,
            });

            expect(serviceProviderResult).toBeDefined();
            expect(serviceProviderResult).toBeInstanceOf(ServiceProvider);
            expect(serviceProviderResult?.logo).toBeUndefined();
        });

        it('should return the service-provider with logo', async () => {
            const serviceProvider: ServiceProvider<true> = await sut.save(DoFactory.createServiceProvider(false));

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
            const serviceProvider: ServiceProvider<true> = await sut.save(DoFactory.createServiceProvider(false));
            const serviceProviderMap: Map<string, ServiceProvider<true>> = await sut.findByIds([serviceProvider.id]);

            expect(serviceProviderMap).toBeDefined();
        });
    });

    describe('findAuthorized', () => {
        describe.each([
            {
                all: true,
            } as PermittedOrgas,
            {
                all: false,
                orgaIds: [faker.string.uuid()],
            } as PermittedOrgas,
        ])('when permissions are %s', (permittedOrgas: PermittedOrgas) => {
            it('should return all service-providers the user is allowed to manage', async () => {
                const permittedOrgaIds: string[] = permittedOrgas.all ? [faker.string.uuid()] : permittedOrgas.orgaIds;

                const serviceProviders: ServiceProvider<true>[] = await Promise.all([
                    sut.save(
                        DoFactory.createServiceProvider(false, { providedOnSchulstrukturknoten: permittedOrgaIds[0] }),
                    ),
                    sut.save(
                        DoFactory.createServiceProvider(false, { providedOnSchulstrukturknoten: faker.string.uuid() }),
                    ),
                ]);

                const permissions: DeepMocked<PersonPermissions> = createMock(PersonPermissions);
                permissions.getOrgIdsWithSystemrecht = vi.fn().mockReturnValue(permittedOrgas);

                const [serviceProviderResult, count]: Counted<ServiceProvider<true>> = await sut.findAuthorized(
                    permissions,
                    5,
                    0,
                );

                if (permittedOrgas.all) {
                    expect(serviceProviderResult).toHaveLength(serviceProviders.length);
                    expect(count).toEqual(serviceProviders.length);
                } else {
                    expect(serviceProviderResult).toHaveLength(1);
                    expect(serviceProviderResult[0]!.id).toEqual(serviceProviders[0]!.id);
                    expect(count).toEqual(1);
                }
            });
        });

        it('should respect the limit and offset', async () => {
            const total: number = 10;
            await Promise.all(Array.from({ length: total }, () => sut.save(DoFactory.createServiceProvider(false))));
            const permittedOrgas: PermittedOrgas = { all: true };
            const permissions: DeepMocked<PersonPermissions> = createMock(PersonPermissions);
            permissions.getOrgIdsWithSystemrecht = vi.fn().mockReturnValue(permittedOrgas);
            const limit: number = 5;
            const [serviceProviderWithoutOffsetResult, countWithoutOffset]: Counted<ServiceProvider<true>> =
                await sut.findAuthorized(permissions, limit, 0);
            expect(serviceProviderWithoutOffsetResult).toHaveLength(limit);
            expect(countWithoutOffset).toEqual(total);

            const [serviceProviderWithOffsetResult, countWithOffset]: Counted<ServiceProvider<true>> =
                await sut.findAuthorized(permissions, limit, 5);
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
                        ServiceProviderKategorie.ANGEBOTE,
                        ServiceProviderKategorie.UNTERRICHT,
                    ],
                    (kategorie: ServiceProviderKategorie) =>
                        sut.save(DoFactory.createServiceProvider(false, { kategorie })),
                ),
            );
            const permittedOrgas: PermittedOrgas = { all: true };
            const permissions: DeepMocked<PersonPermissions> = createMock(PersonPermissions);
            permissions.getOrgIdsWithSystemrecht = vi.fn().mockReturnValue(permittedOrgas);
            const [serviceProviderResult]: Counted<ServiceProvider<true>> = await sut.findAuthorized(permissions, 5, 0);
            [
                ServiceProviderKategorie.EMAIL,
                ServiceProviderKategorie.UNTERRICHT,
                ServiceProviderKategorie.VERWALTUNG,
                ServiceProviderKategorie.HINWEISE,
                ServiceProviderKategorie.ANGEBOTE,
            ].forEach((kategorie: ServiceProviderKategorie, index: number) => {
                expect(serviceProviderResult[index]!.kategorie).toBe(kategorie);
            });
        });
    });

    describe('findByOrgasWithMerkmal', () => {
        it('returns only service-providers for the given organisation ids that have the rollenerweiterung merkmal', async () => {
            const orgId: string = faker.string.uuid();

            const spWithMerkmal: ServiceProvider<false> = DoFactory.createServiceProvider(false, {
                providedOnSchulstrukturknoten: orgId,
                merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
            });
            const spWithoutMerkmal: ServiceProvider<false> = DoFactory.createServiceProvider(false, {
                providedOnSchulstrukturknoten: orgId,
            });
            const spOtherOrgaWithMerkmal: ServiceProvider<false> = DoFactory.createServiceProvider(false, {
                providedOnSchulstrukturknoten: faker.string.uuid(),
                merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
            });

            const [persistedWithMerkmal]: ServiceProvider<true>[] = await Promise.all([
                sut.save(spWithMerkmal),
                sut.save(spWithoutMerkmal),
                sut.save(spOtherOrgaWithMerkmal),
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
                    sut.save(
                        DoFactory.createServiceProvider(false, {
                            providedOnSchulstrukturknoten: orgId,
                            merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
                        }),
                    ),
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
                    ServiceProviderKategorie.ANGEBOTE,
                    ServiceProviderKategorie.UNTERRICHT,
                ].map((kategorie: ServiceProviderKategorie) =>
                    sut.save(
                        DoFactory.createServiceProvider(false, {
                            kategorie,
                            providedOnSchulstrukturknoten: orgId,
                            merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
                        }),
                    ),
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
                ServiceProviderKategorie.ANGEBOTE,
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
                    sut.save(
                        DoFactory.createServiceProvider(false, { providedOnSchulstrukturknoten: permittedOrgaIds[0] }),
                    ),
                    sut.save(
                        DoFactory.createServiceProvider(false, { providedOnSchulstrukturknoten: faker.string.uuid() }),
                    ),
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
            const expectedServiceProvider: ServiceProvider<true> = await sut.save(
                DoFactory.createServiceProvider(false),
            );

            const actualServiceProvider: Option<ServiceProvider<true>> = await sut.findByName(
                expectedServiceProvider.name,
            );

            expect(actualServiceProvider).toEqual(expectedServiceProvider);
        });

        it('should throw an error if there are no existing ServiceProviders for the given name', async () => {
            await sut.save(DoFactory.createServiceProvider(false));

            const result: Option<ServiceProvider<true>> = await sut.findByName('this-service-provider-does-not-exist');

            expect(result).toBeFalsy();
        });
    });

    describe('findByVidisAngebotId', () => {
        it('should find a ServiceProvider by its VIDIS Angebot ID', async () => {
            const expectedServiceProvider: ServiceProvider<false> = DoFactory.createServiceProvider(false);
            expectedServiceProvider.vidisAngebotId = '1234567';
            const expectedPersistedServiceProvider: ServiceProvider<true> = await sut.save(expectedServiceProvider);
            const anotherServiceProvider: ServiceProvider<false> = DoFactory.createServiceProvider(false);
            anotherServiceProvider.vidisAngebotId = '7777777';
            await sut.save(anotherServiceProvider);

            const actualServiceProvider: Option<ServiceProvider<true>> = await sut.findByVidisAngebotId(
                expectedServiceProvider.vidisAngebotId,
            );

            expect(actualServiceProvider).toEqual(expectedPersistedServiceProvider);
        });

        it('should return null if there are no existing ServiceProviders for the given VIDIS Angebot ID', async () => {
            const serviceProvider: ServiceProvider<false> = DoFactory.createServiceProvider(false);
            serviceProvider.vidisAngebotId = '1234567';
            await sut.save(serviceProvider);

            const result: Option<ServiceProvider<true>> = await sut.findByVidisAngebotId('7777777');

            expect(result).toBeFalsy();
        });
    });

    describe('findByKeycloakGroup', () => {
        it('should find a ServiceProvider by its Keycloak groupname', async () => {
            const expectedServiceProvider: ServiceProvider<false> = DoFactory.createServiceProvider(false);
            expectedServiceProvider.keycloakGroup = 'keycloak-group-1';
            const expectedPersistedServiceProvider: ServiceProvider<true> = await sut.save(expectedServiceProvider);
            const anotherServiceProvider: ServiceProvider<false> = DoFactory.createServiceProvider(false);
            anotherServiceProvider.keycloakGroup = 'keycloak-group-2';
            await sut.save(anotherServiceProvider);

            let result: ServiceProvider<true>[] = [];
            if (expectedServiceProvider.keycloakGroup) {
                result = await sut.findByKeycloakGroup(expectedServiceProvider.keycloakGroup);
            }

            expect(result).toEqual([expectedPersistedServiceProvider]);
        });
    });

    describe('findBySchulstrukturknoten', () => {
        it('should return the service provider', async () => {
            const providedOnSchulstrukturknoten: string = faker.string.uuid();
            const sp: ServiceProvider<false> = DoFactory.createServiceProvider(false, {
                providedOnSchulstrukturknoten,
            });
            const persistedServiceProvider: ServiceProvider<true> = await sut.save(sp);
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
            const serviceProvider: ServiceProvider<false> = DoFactory.createServiceProvider(false);
            const persistedPersistedServiceProvider: ServiceProvider<true> = await sut.save(serviceProvider);

            const result: boolean = await sut.deleteById(persistedPersistedServiceProvider.id);

            expect(result).toBeTruthy();
        });
    });

    describe('deleteByName', () => {
        it('should delete an existing ServiceProvider by its name', async () => {
            const serviceProvider: ServiceProvider<false> = DoFactory.createServiceProvider(false);
            const persistedPersistedServiceProvider: ServiceProvider<true> = await sut.save(serviceProvider);

            const result: boolean = await sut.deleteByName(persistedPersistedServiceProvider.name);

            expect(result).toBeTruthy();
        });
    });
});
