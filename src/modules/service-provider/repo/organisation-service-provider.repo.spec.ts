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
import { EventService } from '../../../core/eventbus/services/event.service.js';
import { createMock } from '@golevelup/ts-jest';

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
                    provide: EventService,
                    useValue: createMock<EventService>(),
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
            const organisation: Organisation<true> = DoFactory.createOrganisation(true);
            const serviceProvider: ServiceProvider<true> = DoFactory.createServiceProvider(true);
            await organisationRepo.save(organisation);
            await serviceProviderRepo.save(serviceProvider);

            await expect(sut.save(organisation, serviceProvider)).resolves.not.toThrow();
        });
    });

    describe('deleteAll', () => {
        it('should delete all existing OrganisationServiceProvider mappings', async () => {
            const organisation: Organisation<true> = DoFactory.createOrganisation(true);
            const organisation2: Organisation<true> = DoFactory.createOrganisation(true);
            const serviceProvider: ServiceProvider<true> = DoFactory.createServiceProvider(true);
            const serviceProvider2: ServiceProvider<true> = DoFactory.createServiceProvider(true);
            const serviceProvider3: ServiceProvider<true> = DoFactory.createServiceProvider(true);
            await sut.save(organisation, serviceProvider);
            await sut.save(organisation, serviceProvider2);
            await sut.save(organisation2, serviceProvider2);
            await sut.save(organisation2, serviceProvider3);

            const result: boolean = await sut.deleteAll();

            expect(result).toBeTruthy();
        });
    });
});
