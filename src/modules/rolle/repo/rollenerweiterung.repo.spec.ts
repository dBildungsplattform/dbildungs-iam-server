import { EntityManager, MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import { createMock, DeepMocked } from '@golevelup/ts-jest';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DoFactory,
    LoggingTestModule,
} from '../../../../test/utils/index.js';
import { EventRoutingLegacyKafkaService } from '../../../core/eventbus/services/event-routing-legacy-kafka.service.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { RolleFactory } from '../domain/rolle.factory.js';
import { Rolle } from '../domain/rolle.js';
import { RollenerweiterungFactory } from '../domain/rollenerweiterung.factory.js';
import { Rollenerweiterung } from '../domain/rollenerweiterung.js';
import { RolleRepo } from './rolle.repo.js';
import { RollenerweiterungRepo } from './rollenerweiterung.repo.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { faker } from '@faker-js/faker';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';

describe('RollenerweiterungRepo', () => {
    let module: TestingModule;
    let sut: RollenerweiterungRepo;
    let orm: MikroORM;
    let em: EntityManager;
    let factory: RollenerweiterungFactory;
    let organisationRepo: OrganisationRepository;
    let rolleRepo: RolleRepo;
    let serviceProviderRepo: ServiceProviderRepo;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, LoggingTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true })],
            providers: [
                RolleRepo,
                RolleFactory,
                RollenerweiterungRepo,
                RollenerweiterungFactory,
                ServiceProviderRepo,
                OrganisationRepository,
                EventRoutingLegacyKafkaService,
            ],
        })
            .overrideProvider(EventRoutingLegacyKafkaService)
            .useValue(createMock<EventRoutingLegacyKafkaService>())
            .compile();

        sut = module.get(RollenerweiterungRepo);
        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        factory = module.get(RollenerweiterungFactory);
        organisationRepo = module.get(OrganisationRepository);
        rolleRepo = module.get(RolleRepo);
        serviceProviderRepo = module.get(ServiceProviderRepo);

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

    describe('createAuthorized', () => {
        type TestCase = 'root' | 'schuladmin';
        let organisation: Organisation<true>;
        let rolle: Rolle<true>;
        let serviceProvider: ServiceProvider<true>;
        let permissionMock: DeepMocked<PersonPermissions>;

        beforeEach(async () => {
            organisation = await organisationRepo.save(DoFactory.createOrganisation(false));
            const rolleOrError: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
            if (rolleOrError instanceof DomainError) {
                throw new Error('Failed to create Rolle');
            }
            rolle = rolleOrError;
            serviceProvider = await serviceProviderRepo.save(DoFactory.createServiceProvider(false));
            permissionMock = createMock<PersonPermissions>();
        });

        it.each([['root' as TestCase], ['schuladmin' as TestCase]])(
            'should create a new rollenerweiterung as %s',
            async (adminType: TestCase) => {
                if (adminType === 'root') {
                    permissionMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce({ all: true });
                }
                if (adminType === 'schuladmin') {
                    permissionMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce({
                        all: false,
                        orgaIds: [organisation.id],
                    });
                }
                const rollenerweiterung: Rollenerweiterung<false> = factory.createNew(
                    organisation.id,
                    rolle.id,
                    serviceProvider.id,
                );

                const savedRollenerweiterung: Result<Rollenerweiterung<true>, DomainError> = await sut.createAuthorized(
                    rollenerweiterung,
                    permissionMock,
                );

                expect(savedRollenerweiterung.ok).toBe(true);
                if (savedRollenerweiterung.ok) {
                    expect(savedRollenerweiterung.value.organisationId).toBe(rollenerweiterung.organisationId);
                    expect(savedRollenerweiterung.value.rolleId).toBe(rollenerweiterung.rolleId);
                    expect(savedRollenerweiterung.value.serviceProviderId).toBe(rollenerweiterung.serviceProviderId);
                }
            },
        );

        it('should return an error if permissions are missing', async () => {
            permissionMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce({ all: false, orgaIds: [] });
            const rollenerweiterung: Rollenerweiterung<false> = factory.createNew(
                organisation.id,
                rolle.id,
                serviceProvider.id,
            );

            const savedRollenerweiterung: Result<Rollenerweiterung<true>, DomainError> = await sut.createAuthorized(
                rollenerweiterung,
                permissionMock,
            );

            expect(savedRollenerweiterung.ok).toBe(false);
            if (!savedRollenerweiterung.ok) {
                expect(savedRollenerweiterung.error).toBeInstanceOf(MissingPermissionsError);
            }
        });

        it('should return an error if references are invalid', async () => {
            permissionMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce({ all: true });
            const rollenerweiterung: Rollenerweiterung<false> = factory.createNew(
                faker.string.uuid(),
                rolle.id,
                serviceProvider.id,
            );

            const savedRollenerweiterung: Result<Rollenerweiterung<true>, DomainError> = await sut.createAuthorized(
                rollenerweiterung,
                permissionMock,
            );

            expect(savedRollenerweiterung.ok).toBe(false);
            if (!savedRollenerweiterung.ok) {
                expect(savedRollenerweiterung.error).toBeInstanceOf(EntityNotFoundError);
            }
        });
    });
});
