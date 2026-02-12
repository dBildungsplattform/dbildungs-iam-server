import { EntityManager, MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
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
import { OrganisationID, ServiceProviderID } from '../../../shared/types/aggregate-ids.types.js';
import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { LoggingTestModule } from '../../../../test/utils/logging-test.module.js';
import { DatabaseTestModule } from '../../../../test/utils/database-test.module.js';
import { DEFAULT_TIMEOUT_FOR_TESTCONTAINERS } from '../../../../test/utils/timeouts.js';
import { DoFactory } from '../../../../test/utils/do-factory.js';
import { createPersonPermissionsMock } from '../../../../test/utils/auth.mock.js';
import { expectErrResult } from '../../../../test/utils/index.js';

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
            .useValue(createMock(EventRoutingLegacyKafkaService))
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

    describe('findManyByOrganisationIdAndServiceProviderId', () => {
        let organisation: Organisation<true>;
        let otherOrganisation: Organisation<true>;
        let rolle: Rolle<true>;
        let serviceProvider: ServiceProvider<true>;
        let otherServiceProvider: ServiceProvider<true>;

        beforeEach(async () => {
            organisation = await organisationRepo.save(DoFactory.createOrganisation(false));
            otherOrganisation = await organisationRepo.save(DoFactory.createOrganisation(false));
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
            otherServiceProvider = await serviceProviderRepo.save(
                DoFactory.createServiceProvider(false, {
                    merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
                }),
            );
            await sut.create(factory.createNew(organisation.id, rolle.id, serviceProvider.id));
            await sut.create(factory.createNew(organisation.id, rolle.id, otherServiceProvider.id));
            await sut.create(factory.createNew(otherOrganisation.id, rolle.id, serviceProvider.id));
        });

        it('should return all rollenerweiterungen for given organisation and serviceProvider', async () => {
            const result: Rollenerweiterung<true>[] = await sut.findManyByOrganisationIdAndServiceProviderId(
                organisation.id,
                serviceProvider.id,
            );
            expect(result).toBeInstanceOf(Array);
            expect(result).toHaveLength(1);
            expect(result[0]!.organisationId).toBe(organisation.id);
            expect(result[0]!.serviceProviderId).toBe(serviceProvider.id);
        });

        it('should return empty array if no rollenerweiterung exists for given organisation and serviceProvider', async () => {
            const result: Rollenerweiterung<true>[] = await sut.findManyByOrganisationIdAndServiceProviderId(
                faker.string.uuid(),
                faker.string.uuid(),
            );
            expect(result).toBeInstanceOf(Array);
            expect(result).toHaveLength(0);
        });

        it('should return correct rollenerweiterung if multiple exist for same organisation but different serviceProvider', async () => {
            const result: Rollenerweiterung<true>[] = await sut.findManyByOrganisationIdAndServiceProviderId(
                organisation.id,
                otherServiceProvider.id,
            );
            expect(result).toBeInstanceOf(Array);
            expect(result).toHaveLength(1);
            expect(result[0]!.organisationId).toBe(organisation.id);
            expect(result[0]!.serviceProviderId).toBe(otherServiceProvider.id);
        });

        it('should return correct rollenerweiterung if multiple exist for same serviceProvider but different organisation', async () => {
            const result: Rollenerweiterung<true>[] = await sut.findManyByOrganisationIdAndServiceProviderId(
                otherOrganisation.id,
                serviceProvider.id,
            );
            expect(result).toBeInstanceOf(Array);
            expect(result).toHaveLength(1);
            expect(result[0]!.organisationId).toBe(otherOrganisation.id);
            expect(result[0]!.serviceProviderId).toBe(serviceProvider.id);
        });
    });

    describe('deleteByComposedId', () => {
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
            const re: Rollenerweiterung<false> = factory.createNew(organisation.id, rolle.id, serviceProvider.id);
            await sut.create(re);
        });

        it('should delete an existing rollenerweiterung and return Ok(null)', async () => {
            const result: Result<null, DomainError> = await sut.deleteByComposedId({
                organisationId: organisation.id,
                rolleId: rolle.id,
                serviceProviderId: serviceProvider.id,
            });
            expect(result.ok).toBe(true);
            if (!result.ok) {
                return;
            }
            expect(result.value).toBeNull();

            // Ensure it is deleted
            const exists: boolean = await sut.exists({
                organisationId: organisation.id,
                rolleId: rolle.id,
                serviceProviderId: serviceProvider.id,
            });
            expect(exists).toBe(false);
        });

        it('should return EntityNotFoundError if rollenerweiterung does not exist', async () => {
            const result: Result<null, DomainError> = await sut.deleteByComposedId({
                organisationId: faker.string.uuid(),
                rolleId: faker.string.uuid(),
                serviceProviderId: faker.string.uuid(),
            });
            expectErrResult(result);
            expect(result.error).toBeInstanceOf(EntityNotFoundError);
        });
    });

    describe('findByServiceProviderIds', () => {
        let organisations: Array<Organisation<true>>;
        let rollen: Array<Rolle<true>>;
        let serviceProviders: Array<ServiceProvider<true>>;
        let factory: RollenerweiterungFactory;

        beforeEach(async () => {
            const parentOrga: Organisation<true> = await organisationRepo.save(DoFactory.createOrganisation(false));
            organisations = await Promise.all(
                [0, 1].map(() =>
                    organisationRepo.save(DoFactory.createOrganisation(false, { administriertVon: parentOrga.id })),
                ),
            );
            rollen = (
                await Promise.all(
                    [0, 1].map(() =>
                        rolleRepo.save(
                            DoFactory.createRolle(false, {
                                administeredBySchulstrukturknoten: parentOrga.id,
                            }),
                        ),
                    ),
                )
            ).filter((rolle: Rolle<true> | DomainError): rolle is Rolle<true> => {
                if (rolle instanceof Rolle) {
                    return true;
                } else {
                    throw rolle;
                }
            });
            serviceProviders = await Promise.all(
                [0, 1, 2].map(() =>
                    serviceProviderRepo.save(
                        DoFactory.createServiceProvider(false, {
                            merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
                        }),
                    ),
                ),
            );
            factory = module.get(RollenerweiterungFactory);

            await Promise.all([
                sut.create(factory.createNew(organisations[0]!.id, rollen[0]!.id, serviceProviders[0]!.id)),
                sut.create(factory.createNew(organisations[0]!.id, rollen[1]!.id, serviceProviders[0]!.id)),
                sut.create(factory.createNew(organisations[1]!.id, rollen[0]!.id, serviceProviders[1]!.id)),
                sut.create(factory.createNew(organisations[1]!.id, rollen[1]!.id, serviceProviders[2]!.id)),
            ]);
        });

        it('should return a map with arrays of rollenerweiterungen for each serviceProviderId', async () => {
            const ids: string[] = [serviceProviders[0]!.id, serviceProviders[1]!.id, serviceProviders[2]!.id];
            const result: Map<ServiceProviderID, Rollenerweiterung<true>[]> = await sut.findByServiceProviderIds(ids);

            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBe(3);

            expect(result.get(serviceProviders[0]!.id)).toBeInstanceOf(Array);
            expect(result.get(serviceProviders[0]!.id)).toHaveLength(2);
            expect(result.get(serviceProviders[1]!.id)).toHaveLength(1);
            expect(result.get(serviceProviders[2]!.id)).toHaveLength(1);

            for (const id of ids) {
                for (const re of result.get(id)!) {
                    expect(re.serviceProviderId).toBe(id);
                }
            }
        });

        it('should return empty arrays for serviceProviderIds with no rollenerweiterungen', async () => {
            const unusedServiceProvider: ServiceProvider<true> = await serviceProviderRepo.save(
                DoFactory.createServiceProvider(false, {
                    merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
                }),
            );
            const ids: string[] = [unusedServiceProvider.id];
            const result: Map<ServiceProviderID, Rollenerweiterung<true>[]> = await sut.findByServiceProviderIds(ids);

            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBe(1);
            expect(result.get(unusedServiceProvider.id)).toBeInstanceOf(Array);
            expect(result.get(unusedServiceProvider.id)).toHaveLength(0);
        });

        it('should return an empty map if input array is empty', async () => {
            const result: Map<ServiceProviderID, Rollenerweiterung<true>[]> = await sut.findByServiceProviderIds([]);
            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBe(0);
        });
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
            organisation = await organisationRepo.save(
                DoFactory.createOrganisation(false, {
                    administriertVon: faker.string.uuid(),
                }),
            );
            const rolleOrError: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    administeredBySchulstrukturknoten: organisation.id,
                }),
            );
            if (rolleOrError instanceof DomainError) {
                throw new Error('Failed to create Rolle');
            }
            rolle = rolleOrError;
            serviceProvider = await serviceProviderRepo.save(
                DoFactory.createServiceProvider(false, {
                    merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
                }),
            );
            permissionMock = createPersonPermissionsMock();
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
            permissionMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce({ all: true });
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
            const parentOrga: Organisation<true> = await organisationRepo.save(DoFactory.createOrganisation(false));
            organisations = await Promise.all(
                makeN(
                    () =>
                        organisationRepo.save(DoFactory.createOrganisation(false, { administriertVon: parentOrga.id })),
                    3,
                ),
            );
            rollen = (
                await Promise.all(
                    makeN(
                        () =>
                            rolleRepo.save(
                                DoFactory.createRolle(false, {
                                    administeredBySchulstrukturknoten: parentOrga.id,
                                }),
                            ),
                        3,
                    ),
                )
            ).filter((rolle: Rolle<true> | DomainError): rolle is Rolle<true> => {
                if (rolle instanceof Rolle) {
                    return true;
                } else {
                    throw rolle;
                }
            });
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
            permissionMock = createPersonPermissionsMock();
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
            const parentOrga: Organisation<true> = await organisationRepo.save(DoFactory.createOrganisation(false));
            organisations = await Promise.all(
                makeN(
                    () =>
                        organisationRepo.save(DoFactory.createOrganisation(false, { administriertVon: parentOrga.id })),
                    3,
                ),
            );
            rollen = (
                await Promise.all(
                    makeN(
                        () =>
                            rolleRepo.save(
                                DoFactory.createRolle(false, { administeredBySchulstrukturknoten: parentOrga.id }),
                            ),
                        3,
                    ),
                )
            ).filter((rolle: Rolle<true> | DomainError): rolle is Rolle<true> => {
                if (rolle instanceof Rolle) {
                    return true;
                } else {
                    throw rolle;
                }
            });
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
            permissionMock = createPersonPermissionsMock();
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
                await sut.findByServiceProviderIdPagedAndSortedByOrgaKennung(serviceProvider.id, undefined, 1, 2);
            expect(result).toBeInstanceOf(Array);
            expect(result).toHaveLength(2);
            expect(count).toBe(3);
        });

        it('should return only rollenerweiterungen for the given organisationIds', async () => {
            const erweiterungen: Rollenerweiterung<false>[] = [
                factory.createNew(organisation1.id, rolle.id, serviceProvider.id),
                factory.createNew(organisation2.id, rolle.id, serviceProvider.id),
                factory.createNew(organisation3.id, rolle.id, serviceProvider.id),
            ];
            await Promise.all(erweiterungen.map((re: Rollenerweiterung<false>) => sut.create(re)));

            // Only organisation1 and organisation3 should be included
            const orgaIds: string[] = [organisation1.id, organisation3.id];
            const [result, count]: Counted<Rollenerweiterung<true>> =
                await sut.findByServiceProviderIdPagedAndSortedByOrgaKennung(serviceProvider.id, orgaIds);

            expect(result).toBeInstanceOf(Array);
            expect(result).toHaveLength(2);
            expect(count).toBe(2);
            expect(result.map((r: Rollenerweiterung<true>) => r.organisationId).sort()).toEqual(orgaIds.sort());
            for (const erweiterung of result) {
                expect(orgaIds).toContain(erweiterung.organisationId);
                expect(erweiterung.serviceProviderId).toBe(serviceProvider.id);
            }
        });

        it('should return rollenerweiterungen for all organisationIds', async () => {
            const erweiterungen: Rollenerweiterung<false>[] = [
                factory.createNew(organisation1.id, rolle.id, serviceProvider.id),
                factory.createNew(organisation2.id, rolle.id, serviceProvider.id),
                factory.createNew(organisation3.id, rolle.id, serviceProvider.id),
            ];
            await Promise.all(erweiterungen.map((re: Rollenerweiterung<false>) => sut.create(re)));

            const [result, count]: Counted<Rollenerweiterung<true>> =
                await sut.findByServiceProviderIdPagedAndSortedByOrgaKennung(serviceProvider.id, undefined);

            expect(result).toBeInstanceOf(Array);
            expect(result).toHaveLength(3);
            expect(count).toBe(3);
        });
    });
});
