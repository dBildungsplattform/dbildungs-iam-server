import { faker } from '@faker-js/faker';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DatabaseTestModule,
    DoFactory,
    LoggingTestModule,
} from '../../../../test/utils/index.js';
import { ServiceProvider } from '../domain/service-provider.js';
import { ServiceProviderRepo } from './service-provider.repo.js';
import { EventService } from '../../../core/eventbus/index.js';
import { createMock } from '@golevelup/ts-jest';
import { RolleServiceProviderEntity } from '../../rolle/entity/rolle-service-provider.entity.js';
import { RolleID } from '../../../shared/types/aggregate-ids.types.js';

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
                {
                    provide: EventService,
                    useValue: createMock<EventService>(),
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

            const mockEventService: EventService = module.get<EventService>(EventService);

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

    it('should return an array of RolleServiceProviderEntity with an Array', async () => {
        const role: RolleID = faker.string.uuid();
        const serviceProviderResult: RolleServiceProviderEntity[] = await sut.fetchRolleServiceProvidersWithoutPerson([
            role,
        ]);
        expect(serviceProviderResult).toBeDefined();
    });
    it('should return an array of RolleServiceProviderEntity with a single rolle', async () => {
        const role: RolleID = faker.string.uuid();

        const serviceProviderResult: RolleServiceProviderEntity[] =
            await sut.fetchRolleServiceProvidersWithoutPerson(role);
        expect(serviceProviderResult).toBeDefined();
    });
});
