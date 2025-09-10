import { faker } from '@faker-js/faker';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DoFactory,
    LoggingTestModule,
    MapperTestModule,
} from '../../../../test/utils/index.js';
import { UsernameGeneratorService } from '../../person/domain/username-generator.service.js';
import { PersonFactory } from '../../person/domain/person.factory.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { Person } from '../../person/domain/person.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { RolleModule } from '../../rolle/rolle.module.js';
import { OrganisationModule } from '../../organisation/organisation.module.js';
import { PersonID } from '../../../shared/types/aggregate-ids.types.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleFactory } from '../../rolle/domain/rolle.factory.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { createMock } from '@golevelup/ts-jest';
import { KeycloakUserService } from '../../keycloak-administration/index.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { UserLockRepository } from '../../keycloak-administration/repository/user-lock.repository.js';
import { generatePassword } from '../../../shared/util/password-generator.js';
import { OxUserBlacklistRepo } from '../../person/persistence/ox-user-blacklist.repo.js';
import { EntityAggregateMapper } from '../../person/mapper/entity-aggregate.mapper.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { SchulconnexRepo } from './schulconnex.repo.js';
import { PersonenkontextFactory } from '../../personenkontext/domain/personenkontext.factory.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { DBiamPersonenkontextRepoInternal } from '../../personenkontext/persistence/internal-dbiam-personenkontext.repo.js';
import { SchulconnexModule } from '../schulconnex.module.js';
import { RollenerweiterungRepo } from '../../rolle/repo/rollenerweiterung.repo.js';

describe('Schulconnex Repo', () => {
    let module: TestingModule;
    let sut: SchulconnexRepo;
    let orm: MikroORM;
    let em: EntityManager;

    let personenkontextRepoInternal: DBiamPersonenkontextRepoInternal;
    let personFactory: PersonFactory;
    let personRepo: PersonRepository;
    let organisationRepository: OrganisationRepository;
    let serviceProviderRepo: ServiceProviderRepo;
    let rolleRepo: RolleRepo;
    let rollenErweiterungRepo: RollenerweiterungRepo;

    let personenkontextFactory: PersonenkontextFactory;

    function createPersonenkontext<WasPersisted extends boolean>(
        this: void,
        withId: WasPersisted,
        params: Partial<Personenkontext<boolean>> = {},
    ): Personenkontext<WasPersisted> {
        const personenkontext: Personenkontext<WasPersisted> = personenkontextFactory.construct<boolean>(
            withId ? faker.string.uuid() : undefined,
            withId ? faker.date.past() : undefined,
            withId ? faker.date.recent() : undefined,
            undefined,
            faker.string.uuid(),
            faker.string.uuid(),
            faker.string.uuid(),
        );

        Object.assign(personenkontext, params);

        return personenkontext;
    }

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                MapperTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                RolleModule,
                OrganisationModule,
                LoggingTestModule,
                SchulconnexModule,
            ],
            providers: [
                SchulconnexRepo,
                DBiamPersonenkontextRepoInternal,
                PersonFactory,
                PersonRepository,
                RollenerweiterungRepo,
                UsernameGeneratorService,
                OxUserBlacklistRepo,
                RolleFactory,
                RolleRepo,
                ServiceProviderRepo,
                PersonenkontextFactory,
                EntityAggregateMapper,
                KeycloakUserService,
                {
                    provide: UserLockRepository,
                    useValue: createMock<UserLockRepository>(),
                },
            ],
        })
            .overrideProvider(KeycloakUserService)
            .useValue(
                createMock<KeycloakUserService>({
                    create: () =>
                        Promise.resolve({
                            ok: true,
                            value: faker.string.uuid(),
                        }),
                    setPassword: () =>
                        Promise.resolve({
                            ok: true,
                            value: faker.string.alphanumeric(16),
                        }),
                }),
            )
            .compile();

        sut = module.get(SchulconnexRepo);
        personenkontextRepoInternal = module.get(DBiamPersonenkontextRepoInternal);
        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        personFactory = module.get(PersonFactory);
        personRepo = module.get(PersonRepository);
        organisationRepository = module.get(OrganisationRepository);
        rolleRepo = module.get(RolleRepo);
        serviceProviderRepo = module.get(ServiceProviderRepo);
        personenkontextFactory = module.get(PersonenkontextFactory);
        rollenErweiterungRepo = module.get(RollenerweiterungRepo);

        await DatabaseTestModule.setupDatabase(orm);
    }, 10000000);

    async function createPerson(): Promise<Person<true>> {
        const personResult: Person<false> | DomainError = await personFactory.createNew({
            vorname: faker.person.firstName(),
            familienname: faker.person.lastName(),
            username: faker.internet.userName(),
            password: generatePassword(),
        });
        if (personResult instanceof DomainError) {
            throw personResult;
        }
        const person: Person<true> | DomainError = await personRepo.create(personResult); //Error
        if (person instanceof DomainError) {
            throw person;
        }

        return person;
    }

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

    describe('findPersonIdsWithRollenerweiterungForServiceProviderAndOptionallyOrganisations', () => {
        it('should return empty array if serviceProviderIds is empty', async () => {
            const organisationA: Organisation<true> = await organisationRepository.save(
                DoFactory.createOrganisation(false),
            );
            const personIds: PersonID[] =
                await sut.findPersonIdsWithRollenerweiterungForServiceProviderAndOptionallyOrganisations(
                    new Set([]),
                    new Set([organisationA.id]),
                );
            expect(personIds).toHaveLength(0);
        });

        it('should return only persons at organisation with correct serviceProvider-Role', async () => {
            const personA: Person<true> = await createPerson();
            const personB: Person<true> = await createPerson();
            const personC: Person<true> = await createPerson();
            const serviceProviderA: ServiceProvider<true> = await serviceProviderRepo.save(
                DoFactory.createServiceProvider(false),
            );
            const rolleA: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, { serviceProviderIds: [serviceProviderA.id] }),
            );
            const rolleB: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
            const organisationA: Organisation<true> = await organisationRepository.save(
                DoFactory.createOrganisation(false),
            );
            const organisationB: Organisation<true> = await organisationRepository.save(
                DoFactory.createOrganisation(false),
            );
            if (rolleA instanceof DomainError) throw Error();
            if (rolleB instanceof DomainError) throw Error();

            await rollenErweiterungRepo.create(
                DoFactory.createRollenerweiterung(false, {
                    rolleId: rolleA.id,
                    organisationId: organisationA.id,
                    serviceProviderId: serviceProviderA.id,
                }),
            );

            await Promise.all([
                personenkontextRepoInternal.save(
                    createPersonenkontext(false, {
                        personId: personA.id,
                        rolleId: rolleA.id,
                        organisationId: organisationA.id,
                    }),
                ),
                personenkontextRepoInternal.save(
                    createPersonenkontext(false, {
                        personId: personB.id,
                        rolleId: rolleA.id,
                        organisationId: organisationB.id,
                    }),
                ),
                personenkontextRepoInternal.save(
                    createPersonenkontext(false, {
                        personId: personC.id,
                        rolleId: rolleB.id,
                        organisationId: organisationA.id,
                    }),
                ),
            ]);

            const personIds: PersonID[] =
                await sut.findPersonIdsWithRollenerweiterungForServiceProviderAndOptionallyOrganisations(
                    new Set([serviceProviderA.id]),
                    new Set([organisationA.id]),
                );
            expect(personIds).toHaveLength(1);
            expect(personIds.at(0)).toEqual(personA.id);
        });

        it('should return all persons at all organisation with correct serviceProvider-Role', async () => {
            const personA: Person<true> = await createPerson();
            const personB: Person<true> = await createPerson();
            const personC: Person<true> = await createPerson();
            const serviceProviderA: ServiceProvider<true> = await serviceProviderRepo.save(
                DoFactory.createServiceProvider(false),
            );
            const rolleA: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, { serviceProviderIds: [serviceProviderA.id] }),
            );
            const rolleB: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
            const organisationA: Organisation<true> = await organisationRepository.save(
                DoFactory.createOrganisation(false),
            );
            const organisationB: Organisation<true> = await organisationRepository.save(
                DoFactory.createOrganisation(false),
            );
            if (rolleA instanceof DomainError) throw Error();
            if (rolleB instanceof DomainError) throw Error();

            await rollenErweiterungRepo.create(
                DoFactory.createRollenerweiterung(false, {
                    rolleId: rolleA.id,
                    organisationId: organisationA.id,
                    serviceProviderId: serviceProviderA.id,
                }),
            );

            await Promise.all([
                personenkontextRepoInternal.save(
                    createPersonenkontext(false, {
                        personId: personA.id,
                        rolleId: rolleA.id,
                        organisationId: organisationA.id,
                    }),
                ),
                personenkontextRepoInternal.save(
                    createPersonenkontext(false, {
                        personId: personB.id,
                        rolleId: rolleA.id,
                        organisationId: organisationB.id,
                    }),
                ),
                personenkontextRepoInternal.save(
                    createPersonenkontext(false, {
                        personId: personC.id,
                        rolleId: rolleB.id,
                        organisationId: organisationA.id,
                    }),
                ),
            ]);

            const personIds: PersonID[] =
                await sut.findPersonIdsWithRollenerweiterungForServiceProviderAndOptionallyOrganisations(
                    new Set([serviceProviderA.id]),
                    'all',
                );
            expect(personIds).toHaveLength(2);
            expect(personIds.findIndex((id: PersonID) => id === personA.id)).not.toEqual(-1);
            expect(personIds.findIndex((id: PersonID) => id === personB.id)).not.toEqual(-1);
        });
    });

    describe('findPersonIdsWithKontextAtServiceProvidersAndOptionallyOrganisations', () => {
        it('should return empty array if serviceProviderIds is empty', async () => {
            const organisationA: Organisation<true> = await organisationRepository.save(
                DoFactory.createOrganisation(false),
            );
            const personIds: PersonID[] =
                await sut.findPersonIdsWithKontextAtServiceProvidersAndOptionallyOrganisations(
                    new Set([]),
                    new Set([organisationA.id]),
                );
            expect(personIds).toHaveLength(0);
        });
        it('should return only persons at organisation with correct serviceProvider-Role', async () => {
            const personA: Person<true> = await createPerson();
            const personB: Person<true> = await createPerson();
            const personC: Person<true> = await createPerson();
            const serviceProvierA: ServiceProvider<true> = await serviceProviderRepo.save(
                DoFactory.createServiceProvider(false),
            );
            const rolleA: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, { serviceProviderIds: [serviceProvierA.id] }),
            );
            const rolleB: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
            const organisationA: Organisation<true> = await organisationRepository.save(
                DoFactory.createOrganisation(false),
            );
            const organisationB: Organisation<true> = await organisationRepository.save(
                DoFactory.createOrganisation(false),
            );
            if (rolleA instanceof DomainError) throw Error();
            if (rolleB instanceof DomainError) throw Error();

            await Promise.all([
                personenkontextRepoInternal.save(
                    createPersonenkontext(false, {
                        personId: personA.id,
                        rolleId: rolleA.id,
                        organisationId: organisationA.id,
                    }),
                ),
                personenkontextRepoInternal.save(
                    createPersonenkontext(false, {
                        personId: personB.id,
                        rolleId: rolleA.id,
                        organisationId: organisationB.id,
                    }),
                ),
                personenkontextRepoInternal.save(
                    createPersonenkontext(false, {
                        personId: personC.id,
                        rolleId: rolleB.id,
                        organisationId: organisationA.id,
                    }),
                ),
            ]);

            const personIds: PersonID[] =
                await sut.findPersonIdsWithKontextAtServiceProvidersAndOptionallyOrganisations(
                    new Set([serviceProvierA.id]),
                    new Set([organisationA.id]),
                );
            expect(personIds).toHaveLength(1);
            expect(personIds.at(0)).toEqual(personA.id);
        });

        it('should return all personIds with correct serviceProvider-Role at all organisations', async () => {
            const personA: Person<true> = await createPerson();
            const personB: Person<true> = await createPerson();
            const personC: Person<true> = await createPerson();
            const serviceProvierA: ServiceProvider<true> = await serviceProviderRepo.save(
                DoFactory.createServiceProvider(false),
            );
            const rolleA: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, { serviceProviderIds: [serviceProvierA.id] }),
            );
            const rolleB: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
            const organisationA: Organisation<true> = await organisationRepository.save(
                DoFactory.createOrganisation(false),
            );
            const organisationB: Organisation<true> = await organisationRepository.save(
                DoFactory.createOrganisation(false),
            );
            if (rolleA instanceof DomainError) throw Error();
            if (rolleB instanceof DomainError) throw Error();

            await Promise.all([
                personenkontextRepoInternal.save(
                    createPersonenkontext(false, {
                        personId: personA.id,
                        rolleId: rolleA.id,
                        organisationId: organisationA.id,
                    }),
                ),
                personenkontextRepoInternal.save(
                    createPersonenkontext(false, {
                        personId: personB.id,
                        rolleId: rolleA.id,
                        organisationId: organisationB.id,
                    }),
                ),
                personenkontextRepoInternal.save(
                    createPersonenkontext(false, {
                        personId: personC.id,
                        rolleId: rolleB.id,
                        organisationId: organisationA.id,
                    }),
                ),
            ]);

            const personIds: PersonID[] =
                await sut.findPersonIdsWithKontextAtServiceProvidersAndOptionallyOrganisations(
                    new Set([serviceProvierA.id]),
                    'all',
                );
            expect(personIds).toHaveLength(2);
            expect(personIds.findIndex((id: PersonID) => id === personA.id)).not.toEqual(-1);
            expect(personIds.findIndex((id: PersonID) => id === personB.id)).not.toEqual(-1);
        });
    });
});
