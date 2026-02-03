import { EntityManager, MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import { faker } from '@faker-js/faker';
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
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { ServiceProviderMerkmal } from '../../service-provider/domain/service-provider.enum.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { RolleFactory } from '../domain/rolle.factory.js';
import { Rolle } from '../domain/rolle.js';
import { RollenerweiterungFactory } from '../domain/rollenerweiterung.factory.js';
import { Rollenerweiterung } from '../domain/rollenerweiterung.js';
import { RollenerweiterungEntity } from '../entity/rollenerweiterung.entity.js';
import { NoRedundantRollenerweiterungError } from '../specification/error/no-redundant-rollenerweiterung.error.js';
import { ServiceProviderNichtVerfuegbarFuerRollenerweiterungError } from '../specification/error/service-provider-nicht-verfuegbar-fuer-rollenerweiterung.error.js';
import { RolleRepo } from './rolle.repo.js';
import { RollenerweiterungRepo } from './rollenerweiterung.repo.js';
import { OrganisationID } from '../../../shared/types/aggregate-ids.types.js';

function makeN<T>(fn: () => T, n: number): Array<T> {
    return Array.from({ length: n }, fn);
}

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

    describe('exists', () => {
        let organisation: Organisation<true>;
        let rolle: Rolle<true>;
        let serviceProvider: ServiceProvider<true>;
        beforeEach(async () => {
            organisation = await organisationRepo.save(DoFactory.createOrganisation(false));
            const rolleOrError: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
            if (rolleOrError instanceof DomainError) {
                throw new Error('Failed to create Rolle');
            }
            rolle = rolleOrError;
            serviceProvider = await serviceProviderRepo.save(
                DoFactory.createServiceProvider(false, {
                    merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
                }),
            );
        });

        it.each([
            ['exists', true],
            ['does not exist', false],
        ])('if rollenerweiterung %s, it should return %s', async (_label: string, expected: boolean) => {
            if (expected) {
                const entity: RollenerweiterungEntity = em.create(RollenerweiterungEntity, {
                    organisationId: organisation.id,
                    rolleId: rolle.id,
                    serviceProviderId: serviceProvider.id,
                });
                await em.persistAndFlush(entity);
            }
            const result: boolean = await sut.exists({
                organisationId: organisation.id,
                rolleId: rolle.id,
                serviceProviderId: serviceProvider.id,
            });
            expect(result).toBe(expected);
        });
    });

    describe('create', () => {
        let organisation: Organisation<true>;
        let rolle: Rolle<true>;
        let serviceProvider: ServiceProvider<true>;

        beforeEach(async () => {
            organisation = await organisationRepo.save(DoFactory.createOrganisation(false));
            const rolleOrError: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
            if (rolleOrError instanceof DomainError) {
                throw new Error('Failed to create Rolle');
            }
            rolle = rolleOrError;
            serviceProvider = await serviceProviderRepo.save(
                DoFactory.createServiceProvider(false, {
                    merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
                }),
            );
        });

        it('should create rollenerweiterung', async () => {
            const rollenerweiterung: Rollenerweiterung<false> = factory.createNew(
                organisation.id,
                rolle.id,
                serviceProvider.id,
            );
            const createResult: Rollenerweiterung<true> = await sut.create(rollenerweiterung);
            expect(createResult).toBeInstanceOf(Rollenerweiterung);
        });
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
            serviceProvider = await serviceProviderRepo.save(
                DoFactory.createServiceProvider(false, {
                    merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
                }),
            );
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

            const createResult: Result<Rollenerweiterung<true>, DomainError> = await sut.createAuthorized(
                rollenerweiterung,
                permissionMock,
            );

            expect(createResult.ok).toBe(false);
            if (!createResult.ok) {
                expect(createResult.error).toBeInstanceOf(EntityNotFoundError);
            }
        });

        it('should return an error if rolle already has access to service provider', async () => {
            permissionMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce({ all: true });
            const updatedRolle: Option<Rolle<true>> = await rolleRepo.findById(rolle.id);
            if (!updatedRolle) {
                throw new Error('Rolle not found');
            }
            await updatedRolle.attachServiceProvider(serviceProvider.id);
            await rolleRepo.save(updatedRolle);
            const rollenerweiterung: Rollenerweiterung<false> = factory.createNew(
                organisation.id,
                rolle.id,
                serviceProvider.id,
            );

            const createResult: Result<Rollenerweiterung<true>, DomainError> = await sut.createAuthorized(
                rollenerweiterung,
                permissionMock,
            );

            expect(createResult.ok).toBe(false);
            if (!createResult.ok) {
                expect(createResult.error).toBeInstanceOf(NoRedundantRollenerweiterungError);
            }
        });

        it('should return an error if service provider is not available for rollenerweiterung', async () => {
            const updatedServiceProvider: Option<ServiceProvider<true>> = await serviceProviderRepo.findById(
                serviceProvider.id,
            );
            if (!updatedServiceProvider) {
                throw new Error('Service provider not found');
            }
            updatedServiceProvider.merkmale = [];
            await serviceProviderRepo.save(updatedServiceProvider);

            const rollenerweiterung: Rollenerweiterung<false> = factory.createNew(
                organisation.id,
                rolle.id,
                serviceProvider.id,
            );

            const createResult: Result<Rollenerweiterung<true>, DomainError> = await sut.createAuthorized(
                rollenerweiterung,
                permissionMock,
            );

            expect(createResult.ok).toBe(false);
            if (!createResult.ok) {
                expect(createResult.error).toBeInstanceOf(ServiceProviderNichtVerfuegbarFuerRollenerweiterungError);
            }
        });
    });

    describe('findManyByOrganisationAndRolle', () => {
        let organisations: Array<Organisation<true>>;
        let rollen: Array<Rolle<true>>;
        let serviceProviders: Array<ServiceProvider<true>>;
        let permissionMock: DeepMocked<PersonPermissions>;

        beforeEach(async () => {
            organisations = await Promise.all(
                makeN(() => organisationRepo.save(DoFactory.createOrganisation(false)), 3),
            );
            rollen = (await Promise.all(makeN(() => rolleRepo.save(DoFactory.createRolle(false)), 3))).filter(
                (rolle: Rolle<true> | DomainError): rolle is Rolle<true> => {
                    if (rolle instanceof Rolle) {
                        return true;
                    } else {
                        throw rolle;
                    }
                },
            );
            serviceProviders = await Promise.all(
                makeN(
                    () =>
                        serviceProviderRepo.save(
                            DoFactory.createServiceProvider(false, {
                                merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
                            }),
                        ),
                    3,
                ),
            );
            permissionMock = createMock<PersonPermissions>();
            permissionMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: true });
            const unpersistedRollenerweiterungen: Array<Rollenerweiterung<false>> = [];
            for (const organisation of organisations) {
                for (const rolle of rollen) {
                    for (const serviceProvider of serviceProviders) {
                        unpersistedRollenerweiterungen.push(
                            factory.createNew(organisation.id, rolle.id, serviceProvider.id),
                        );
                    }
                }
            }
            const results: Array<Result<Rollenerweiterung<true>, DomainError>> = await Promise.all(
                unpersistedRollenerweiterungen.map((re: Rollenerweiterung<false>) =>
                    sut.createAuthorized(re, permissionMock),
                ),
            );
            for (const result of results) {
                if (!result.ok) {
                    throw result.error;
                }
            }
        });

        test('should return empty array for empty query', async () => {
            const query: Array<Pick<Rollenerweiterung<boolean>, 'organisationId' | 'rolleId'>> = [];
            const result: Array<Rollenerweiterung<true>> = await sut.findManyByOrganisationAndRolle(query);
            expect(result).toBeInstanceOf(Array);
            expect(result).toHaveLength(0);
        });

        test('should return all rollenerweiterungen for given organisation and rolle', async () => {
            const query: Array<Pick<Rollenerweiterung<boolean>, 'organisationId' | 'rolleId'>> = [
                { organisationId: organisations[0]!.id, rolleId: rollen[0]!.id },
            ];
            const result: Array<Rollenerweiterung<true>> = await sut.findManyByOrganisationAndRolle(query);
            expect(result).toBeInstanceOf(Array);
            expect(result).toHaveLength(3);
            for (const erweiterung of result) {
                expect(erweiterung).toEqual(expect.objectContaining(query[0]!));
            }
        });

        test('should return all rollenerweiterungen for multiple given organisations and rollen', async () => {
            type QueryItem = Pick<Rollenerweiterung<boolean>, 'organisationId' | 'rolleId'>;
            const query: Array<QueryItem> = [
                { organisationId: organisations[0]!.id, rolleId: rollen[0]!.id },
                { organisationId: organisations[1]!.id, rolleId: rollen[1]!.id },
                { organisationId: organisations[2]!.id, rolleId: rollen[2]!.id },
            ];
            const result: Array<Rollenerweiterung<true>> = await sut.findManyByOrganisationAndRolle(query);
            expect(result).toBeInstanceOf(Array);
            expect(result).toHaveLength(9);
            query.forEach((queryItem: QueryItem) => {
                expect(
                    result.filter(
                        (rollenerweiterung: Rollenerweiterung<true>) =>
                            rollenerweiterung.organisationId === queryItem.organisationId &&
                            rollenerweiterung.rolleId === queryItem.rolleId,
                    ),
                ).toHaveLength(3);
            });
        });
    });

    describe('findManyByOrganisationId', () => {
        let organisations: Array<Organisation<true>>;
        let rollen: Array<Rolle<true>>;
        let serviceProviders: Array<ServiceProvider<true>>;
        let permissionMock: DeepMocked<PersonPermissions>;

        beforeEach(async () => {
            organisations = await Promise.all(
                makeN(() => organisationRepo.save(DoFactory.createOrganisation(false)), 3),
            );
            rollen = (await Promise.all(makeN(() => rolleRepo.save(DoFactory.createRolle(false)), 3))).filter(
                (rolle: Rolle<true> | DomainError): rolle is Rolle<true> => {
                    if (rolle instanceof Rolle) {
                        return true;
                    } else {
                        throw rolle;
                    }
                },
            );
            serviceProviders = await Promise.all(
                makeN(
                    () =>
                        serviceProviderRepo.save(
                            DoFactory.createServiceProvider(false, {
                                merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
                            }),
                        ),
                    3,
                ),
            );
            permissionMock = createMock<PersonPermissions>();
            permissionMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: true });
            const unpersistedRollenerweiterungen: Array<Rollenerweiterung<false>> = [];
            for (const organisation of organisations) {
                for (const rolle of rollen) {
                    for (const serviceProvider of serviceProviders) {
                        unpersistedRollenerweiterungen.push(
                            factory.createNew(organisation.id, rolle.id, serviceProvider.id),
                        );
                    }
                }
            }
            const results: Array<Result<Rollenerweiterung<true>, DomainError>> = await Promise.all(
                unpersistedRollenerweiterungen.map((re: Rollenerweiterung<false>) =>
                    sut.createAuthorized(re, permissionMock),
                ),
            );
            for (const result of results) {
                if (!result.ok) {
                    throw result.error;
                }
            }
        });

        test('should return all rollenerweiterungen for given organisation', async () => {
            const organisationId: OrganisationID = organisations[0]!.id;
            const result: Array<Rollenerweiterung<true>> = await sut.findManyByOrganisationId(organisationId);
            expect(result).toBeInstanceOf(Array);
            expect(result).toHaveLength(9);
            for (const erweiterung of result) {
                expect(erweiterung).toEqual(expect.objectContaining({ organisationId }));
            }
        });

        test('should return paged result', async () => {
            const limit: number = 1;
            const organisationId: OrganisationID = organisations[0]!.id;
            const firstPage: Array<Rollenerweiterung<true>> = await sut.findManyByOrganisationId(
                organisationId,
                0,
                limit,
            );
            expect(firstPage).toBeInstanceOf(Array);
            expect(firstPage).toHaveLength(limit);

            const secondPage: Array<Rollenerweiterung<true>> = await sut.findManyByOrganisationId(
                organisationId,
                1,
                limit,
            );
            expect(secondPage).toBeInstanceOf(Array);
            expect(secondPage).toHaveLength(limit);
            expect(firstPage).not.toEqual(expect.arrayContaining(secondPage));
        });
    });

    describe('findByServiceProviderIdPagedAndSortedByOrgaKennung', () => {
        let organisation1: Organisation<true>;
        let organisation2: Organisation<true>;
        let organisation3: Organisation<true>;
        let rolle: Rolle<true>;
        let serviceProvider: ServiceProvider<true>;

        beforeEach(async () => {
            organisation1 = await organisationRepo.save(DoFactory.createOrganisation(false, { kennung: 'A' }));
            organisation2 = await organisationRepo.save(DoFactory.createOrganisation(false, { kennung: 'C' }));
            organisation3 = await organisationRepo.save(DoFactory.createOrganisation(false, { kennung: 'B' }));
            const rolleOrError: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
            if (rolleOrError instanceof DomainError) {
                throw new Error('Failed to create Rolle');
            }
            rolle = rolleOrError;
            serviceProvider = await serviceProviderRepo.save(
                DoFactory.createServiceProvider(false, {
                    merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
                }),
            );
        });

        it('should return empty array and count 0 if no rollenerweiterung exists for serviceProviderId', async () => {
            const [result, count]: Counted<Rollenerweiterung<true>> =
                await sut.findByServiceProviderIdPagedAndSortedByOrgaKennung(serviceProvider.id);
            expect(result).toBeInstanceOf(Array);
            expect(result).toHaveLength(0);
            expect(count).toBe(0);
        });

        it('should return all sorted rollenerweiterungen and correct count for serviceProviderId', async () => {
            const erweiterungen: Rollenerweiterung<false>[] = [
                factory.createNew(organisation1.id, rolle.id, serviceProvider.id),
                factory.createNew(organisation2.id, rolle.id, serviceProvider.id),
                factory.createNew(organisation3.id, rolle.id, serviceProvider.id),
            ];
            await Promise.all(erweiterungen.map((re: Rollenerweiterung<false>) => sut.create(re)));

            const [result, count]: Counted<Rollenerweiterung<true>> =
                await sut.findByServiceProviderIdPagedAndSortedByOrgaKennung(serviceProvider.id);
            expect(result).toBeInstanceOf(Array);
            expect(result).toHaveLength(erweiterungen.length);
            expect(count).toBe(erweiterungen.length);
            for (const erweiterung of result) {
                expect(erweiterung.serviceProviderId).toBe(serviceProvider.id);
            }
            expect(result[0]!.organisationId).toBe(organisation1.id);
            expect(result[1]!.organisationId).toBe(organisation3.id);
            expect(result[2]!.organisationId).toBe(organisation2.id);
        });

        it('should respect limit and offset parameters', async () => {
            const erweiterungen: Rollenerweiterung<false>[] = [
                factory.createNew(organisation1.id, rolle.id, serviceProvider.id),
                factory.createNew(organisation2.id, rolle.id, serviceProvider.id),
                factory.createNew(organisation3.id, rolle.id, serviceProvider.id),
            ];
            await Promise.all(erweiterungen.map((re: Rollenerweiterung<false>) => sut.create(re)));

            const [result, count]: Counted<Rollenerweiterung<true>> =
                await sut.findByServiceProviderIdPagedAndSortedByOrgaKennung(serviceProvider.id, 1, 2);
            expect(result).toBeInstanceOf(Array);
            expect(result).toHaveLength(2);
            expect(count).toBe(3);
        });

        it('should return only service provider for organisationId', async () => {
            const erweiterungen: Rollenerweiterung<false>[] = [
                factory.createNew(organisation1.id, rolle.id, serviceProvider.id),
                factory.createNew(organisation2.id, rolle.id, serviceProvider.id),
                factory.createNew(organisation3.id, rolle.id, serviceProvider.id),
            ];
            await Promise.all(erweiterungen.map((re: Rollenerweiterung<false>) => sut.create(re)));

            const [result, count]: Counted<Rollenerweiterung<true>> =
                await sut.findByServiceProviderIdPagedAndSortedByOrgaKennung(
                    serviceProvider.id,
                    0,
                    10,
                    organisation2.id,
                );
            expect(result).toBeInstanceOf(Array);
            expect(result).toHaveLength(1);
            expect(count).toBe(1);
            expect(result[0]!.organisationId).toBe(organisation2.id);
        });
    });
});
