import { MikroORM, EntityManager } from '@mikro-orm/core';
import { TestingModule, Test } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    LoggingTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DoFactory,
} from '../../../../test/utils/index.js';
import { OrganisationServiceProviderRepo } from './organisation-service-provider.repo.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { ServiceProvider } from '../domain/service-provider.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { ServiceProviderRepo } from './service-provider.repo.js';
import { EventRoutingLegacyKafkaService } from '../../../core/eventbus/services/event-routing-legacy-kafka.service.js';
import { createMock } from '../../../../test/utils/createMock.js';

describe('OrganisationServiceProviderRepo', () => {
    let module: TestingModule;
    let sut: OrganisationServiceProviderRepo;
    let organisationRepo: OrganisationRepository;
    let serviceProviderRepo: ServiceProviderRepo;

    let orm: MikroORM;
    let em: EntityManager;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true }), LoggingTestModule],
            providers: [
                OrganisationServiceProviderRepo,
                OrganisationRepository,
                ServiceProviderRepo,
                {
                    provide: EventRoutingLegacyKafkaService,
                    useValue: createMock(EventRoutingLegacyKafkaService),
                },
            ],
        }).compile();

        sut = module.get(OrganisationServiceProviderRepo);
        organisationRepo = module.get(OrganisationRepository);
        serviceProviderRepo = module.get(ServiceProviderRepo);
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
        expect(organisationRepo).toBeDefined();
        expect(serviceProviderRepo).toBeDefined();
        expect(em).toBeDefined();
    });

    describe('save', () => {
        it('should save a new OrganisationServiceProvider mapping', async () => {
            const organisation: Organisation<false> = DoFactory.createOrganisation(false);
            const serviceProvider: ServiceProvider<false> = DoFactory.createServiceProvider(false);
            const persistedOrganisation: Organisation<true> = await organisationRepo.save(organisation);
            const persistedServiceProvider: ServiceProvider<true> = await serviceProviderRepo.save(serviceProvider);

            await expect(sut.save(persistedOrganisation, persistedServiceProvider)).resolves.not.toThrow();
        });
    });

    describe('deleteAll', () => {
        it('should delete all existing OrganisationServiceProvider mappings', async () => {
            const organisation: Organisation<false> = DoFactory.createOrganisation(false);
            const persistedOrganisation: Organisation<true> = await organisationRepo.save(organisation);
            const organisation2: Organisation<false> = DoFactory.createOrganisation(false);
            const persistedOrganisation2: Organisation<true> = await organisationRepo.save(organisation2);
            const serviceProvider: ServiceProvider<false> = DoFactory.createServiceProvider(false);
            const persistedServiceProvider: ServiceProvider<true> = await serviceProviderRepo.save(serviceProvider);
            const serviceProvider2: ServiceProvider<false> = DoFactory.createServiceProvider(false);
            const persistedServiceProvider2: ServiceProvider<true> = await serviceProviderRepo.save(serviceProvider2);
            const serviceProvider3: ServiceProvider<false> = DoFactory.createServiceProvider(false);
            const persistedServiceProvider3: ServiceProvider<true> = await serviceProviderRepo.save(serviceProvider3);
            await sut.save(persistedOrganisation, persistedServiceProvider);
            await sut.save(persistedOrganisation, persistedServiceProvider2);
            await sut.save(persistedOrganisation2, persistedServiceProvider2);
            await sut.save(persistedOrganisation2, persistedServiceProvider3);

            const result: boolean = await sut.deleteAll();

            expect(result).toBeTruthy();
        });
    });
});
