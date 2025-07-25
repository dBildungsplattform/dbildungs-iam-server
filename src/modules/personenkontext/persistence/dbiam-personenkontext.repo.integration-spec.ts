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
import { Personenkontext, mapAggregateToPartial } from '../domain/personenkontext.js';
import {
    DBiamPersonenkontextRepo,
    ExternalPkData,
    KontextWithOrgaAndRolle,
    RollenCount,
} from './dbiam-personenkontext.repo.js';
import { DBiamPersonenkontextRepoInternal } from './internal-dbiam-personenkontext.repo.js';
import { UsernameGeneratorService } from '../../person/domain/username-generator.service.js';
import { PersonFactory } from '../../person/domain/person.factory.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { Person } from '../../person/domain/person.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { PersonenkontextFactory } from '../domain/personenkontext.factory.js';
import { RolleModule } from '../../rolle/rolle.module.js';
import { OrganisationModule } from '../../organisation/organisation.module.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { OrganisationID, PersonenkontextID, PersonID } from '../../../shared/types/aggregate-ids.types.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleFactory } from '../../rolle/domain/rolle.factory.js';
import { RollenArt, RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { createMock } from '@golevelup/ts-jest';
import { KeycloakUserService } from '../../keycloak-administration/index.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { PersonenkontextScope } from './personenkontext.scope.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import {
    createAndPersistOrganisation,
    createAndPersistRootOrganisation,
} from '../../../../test/utils/organisation-test-helper.js';
import { UserLockRepository } from '../../keycloak-administration/repository/user-lock.repository.js';
import { generatePassword } from '../../../shared/util/password-generator.js';
import { OxUserBlacklistRepo } from '../../person/persistence/ox-user-blacklist.repo.js';
import { EntityAggregateMapper } from '../../person/mapper/entity-aggregate.mapper.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { ServiceProviderSystem } from '../../service-provider/domain/service-provider.enum.js';

describe('dbiam Personenkontext Repo', () => {
    let module: TestingModule;
    let sut: DBiamPersonenkontextRepo;
    let orm: MikroORM;
    let em: EntityManager;

    let personenkontextRepoInternal: DBiamPersonenkontextRepoInternal;
    let personFactory: PersonFactory;
    let personRepo: PersonRepository;
    let organisationRepository: OrganisationRepository;
    let rolleRepo: RolleRepo;
    let serviceProviderRepo: ServiceProviderRepo;
    let rolleFactory: RolleFactory;

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
            ],
            providers: [
                DBiamPersonenkontextRepo,
                DBiamPersonenkontextRepoInternal,
                PersonFactory,
                PersonRepository,
                UsernameGeneratorService,
                OxUserBlacklistRepo,
                RolleFactory,
                RolleRepo,
                ServiceProviderRepo,
                PersonenkontextFactory,
                EntityAggregateMapper,
                {
                    provide: KeycloakUserService,
                    useValue: createMock<KeycloakUserService>({
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
                },
                {
                    provide: UserLockRepository,
                    useValue: createMock<UserLockRepository>(),
                },
            ],
        }).compile();

        sut = module.get(DBiamPersonenkontextRepo);
        personenkontextRepoInternal = module.get(DBiamPersonenkontextRepoInternal);
        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        personFactory = module.get(PersonFactory);
        personRepo = module.get(PersonRepository);
        organisationRepository = module.get(OrganisationRepository);
        rolleRepo = module.get(RolleRepo);
        serviceProviderRepo = module.get(ServiceProviderRepo);
        rolleFactory = module.get(RolleFactory);
        personenkontextFactory = module.get(PersonenkontextFactory);

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
        const person: Person<true> | DomainError = await personRepo.create(personResult);
        if (person instanceof DomainError) {
            throw person;
        }

        return person;
    }

    async function createRolle(
        orgaId: OrganisationID,
        rollenart: RollenArt,
        rechte: RollenSystemRecht[],
    ): Promise<Rolle<true>> {
        const rolle: Rolle<false> | DomainError = rolleFactory.createNew(
            faker.word.noun(),
            orgaId,
            rollenart,
            [],
            rechte,
            [],
            [],
            false,
        );

        if (rolle instanceof DomainError) {
            throw rolle;
        }
        const result: Rolle<true> | DomainError = await rolleRepo.save(rolle);
        if (result instanceof DomainError) throw Error();

        return result;
    }

    function createPermissions(person: Person<true>): PersonPermissions {
        return new PersonPermissions(sut, organisationRepository, rolleRepo, person);
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

    describe('findByID', () => {
        it('should return personenkontext by ID', async () => {
            const person: Person<true> = await createPerson();
            const rolle: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
            const organisation: Organisation<true> = await organisationRepository.save(
                DoFactory.createOrganisation(false),
            );
            if (rolle instanceof DomainError) throw Error();

            const personenkontext: Personenkontext<true> = await personenkontextRepoInternal.save(
                createPersonenkontext(false, {
                    personId: person.id,
                    rolleId: rolle.id,
                    organisationId: organisation.id,
                }),
            );

            const result: Option<Personenkontext<true>> = await sut.findByID(personenkontext.id);

            expect(result).toBeInstanceOf(Personenkontext);
            expect(result?.id).toBe(personenkontext.id);
        });

        it('should return null if not found', async () => {
            const result: Option<Personenkontext<true>> = await sut.findByID(faker.string.uuid());

            expect(result).toBeNull();
        });
    });

    describe('findExternalPkData', () => {
        it('should find relevant external personenkontext data for this person', async () => {
            const person: Person<true> = await createPerson();
            const rolleA: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
            const rolleB: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
            const organisationA: Organisation<true> = await organisationRepository.save(
                DoFactory.createOrganisation(false),
            );
            const organisationB: Organisation<true> = await organisationRepository.save(
                DoFactory.createOrganisation(false),
            );
            if (rolleA instanceof DomainError) throw Error();
            if (rolleB instanceof DomainError) throw Error();

            await personenkontextRepoInternal.save(
                createPersonenkontext(false, {
                    personId: person.id,
                    rolleId: rolleA.id,
                    organisationId: organisationA.id,
                }),
            );
            await personenkontextRepoInternal.save(
                createPersonenkontext(false, {
                    personId: person.id,
                    rolleId: rolleB.id,
                    organisationId: organisationA.id,
                }),
            );
            await personenkontextRepoInternal.save(
                createPersonenkontext(false, {
                    personId: person.id,
                    rolleId: rolleB.id,
                    organisationId: organisationB.id,
                }),
            );

            const result: ExternalPkData[] = await sut.findExternalPkData(person.id);
            expect(result.length).toEqual(3);
            expect(
                result.findIndex(
                    (expk: ExternalPkData) =>
                        expk.rollenart === rolleA.rollenart && expk.kennung === organisationA.kennung,
                ),
            ).not.toEqual(-1);
            expect(
                result.findIndex(
                    (expk: ExternalPkData) =>
                        expk.rollenart === rolleB.rollenart && expk.kennung === organisationA.kennung,
                ),
            ).not.toEqual(-1);
            expect(
                result.findIndex(
                    (expk: ExternalPkData) =>
                        expk.rollenart === rolleB.rollenart && expk.kennung === organisationB.kennung,
                ),
            ).not.toEqual(-1);
        });
    });

    describe('findBy', () => {
        describe('When personenkontext for person exists', () => {
            it('should find all personenkontexte for this person', async () => {
                const person: Person<true> = await createPerson();
                const rolleA: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
                const rolleB: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
                const organisation: Organisation<true> = await organisationRepository.save(
                    DoFactory.createOrganisation(false),
                );
                if (rolleA instanceof DomainError) throw Error();
                if (rolleB instanceof DomainError) throw Error();

                const personenkontextA: Personenkontext<true> = await personenkontextRepoInternal.save(
                    createPersonenkontext(false, {
                        personId: person.id,
                        rolleId: rolleA.id,
                        organisationId: organisation.id,
                    }),
                );
                const personenkontextB: Personenkontext<true> = await personenkontextRepoInternal.save(
                    createPersonenkontext(false, {
                        personId: person.id,
                        rolleId: rolleB.id,
                        organisationId: organisation.id,
                    }),
                );

                const scope: PersonenkontextScope = new PersonenkontextScope().findBy({
                    personId: person.id,
                });

                const [result, count]: Counted<Personenkontext<true>> = await sut.findBy(scope);

                expect(result).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining(mapAggregateToPartial(personenkontextA)),
                        expect.objectContaining(mapAggregateToPartial(personenkontextB)),
                    ]),
                );
                expect(count).toBe(2);
            });
        });

        describe('When no personenkontext matches', () => {
            it('should return an empty list', async () => {
                const [result]: Counted<Personenkontext<true>> = await sut.findBy(new PersonenkontextScope());

                expect(result).not.toBeNull();
                expect(result).toHaveLength(0);
            });
        });
    });

    describe('findByPerson', () => {
        it('should return all personenkontexte for a person', async () => {
            const personA: Person<true> = await createPerson();
            const personB: Person<true> = await createPerson();
            const rolle: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
            const organisation: Organisation<true> = await organisationRepository.save(
                DoFactory.createOrganisation(false),
            );
            if (rolle instanceof DomainError) throw Error();

            await Promise.all([
                personenkontextRepoInternal.save(
                    createPersonenkontext(false, {
                        personId: personA.id,
                        rolleId: rolle.id,
                        organisationId: organisation.id,
                    }),
                ),
                personenkontextRepoInternal.save(
                    createPersonenkontext(false, {
                        personId: personB.id,
                        rolleId: rolle.id,
                        organisationId: organisation.id,
                    }),
                ),
            ]);

            const personenkontexte: Personenkontext<true>[] = await sut.findByPerson(personA.id);

            expect(personenkontexte).toHaveLength(1);
        });
    });

    describe('findByPersonWithOrgaAndRolle', () => {
        it('should return all personenkontexte for a person with orga and rolle', async () => {
            const personA: Person<true> = await createPerson();
            const personB: Person<true> = await createPerson();
            const rolle: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
            const organisation: Organisation<true> = await organisationRepository.save(
                DoFactory.createOrganisation(false),
            );
            if (rolle instanceof DomainError) throw Error();

            await Promise.all([
                personenkontextRepoInternal.save(
                    createPersonenkontext(false, {
                        personId: personA.id,
                        rolleId: rolle.id,
                        organisationId: organisation.id,
                    }),
                ),
                personenkontextRepoInternal.save(
                    createPersonenkontext(false, {
                        personId: personB.id,
                        rolleId: rolle.id,
                        organisationId: organisation.id,
                    }),
                ),
            ]);

            const personenkontexte: Array<KontextWithOrgaAndRolle> = await sut.findByPersonWithOrgaAndRolle(personA.id);

            expect(personenkontexte).toHaveLength(1);
            expect(personenkontexte.at(0)?.organisation.id).toEqual(organisation.id);
            expect(personenkontexte.at(0)?.rolle.id).toEqual(rolle.id);
        });
    });

    describe('findByPersonIdsWithOrgaAndRolle', () => {
        it('should return all personenkontexte for a person with orga and rolle', async () => {
            const personA: Person<true> = await createPerson();
            const personB: Person<true> = await createPerson();
            const rolle: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
            const organisation: Organisation<true> = await organisationRepository.save(
                DoFactory.createOrganisation(false),
            );
            if (rolle instanceof DomainError) throw Error();

            await Promise.all([
                personenkontextRepoInternal.save(
                    createPersonenkontext(false, {
                        personId: personA.id,
                        rolleId: rolle.id,
                        organisationId: organisation.id,
                    }),
                ),
                personenkontextRepoInternal.save(
                    createPersonenkontext(false, {
                        personId: personB.id,
                        rolleId: rolle.id,
                        organisationId: organisation.id,
                    }),
                ),
            ]);

            const personenkontexte: Map<PersonID, KontextWithOrgaAndRolle[]> =
                await sut.findByPersonIdsWithOrgaAndRolle([personA.id, personB.id]);

            expect(personenkontexte.size).toEqual(2);
            expect(personenkontexte.get(personA.id)).toHaveLength(1);
            expect(personenkontexte.get(personB.id)).toHaveLength(1);
        });
    });

    describe('findByRolle', () => {
        it('should return all personenkontexte for a rolle', async () => {
            const person: Person<true> = await createPerson();
            const rolle: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
            const organisation: Organisation<true> = await organisationRepository.save(
                DoFactory.createOrganisation(false),
            );
            if (rolle instanceof DomainError) throw Error();

            await personenkontextRepoInternal.save(
                createPersonenkontext(false, {
                    rolleId: rolle.id,
                    personId: person.id,
                    organisationId: organisation.id,
                }),
            );
            const personenkontexte: Personenkontext<true>[] = await sut.findByRolle(rolle.id);

            expect(personenkontexte).toHaveLength(1);
        });
    });

    describe('findWithRolleAtItslearningOrgaByCursor', () => {
        it('should return all personenkontexte for a rolle', async () => {
            const person: Person<true> = await createPerson();
            const sp: ServiceProvider<true> = await serviceProviderRepo.save(
                DoFactory.createServiceProvider(false, { externalSystem: ServiceProviderSystem.ITSLEARNING }),
            );
            const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, { serviceProviderIds: [sp.id] }),
            );
            const organisation: Organisation<true> = await organisationRepository.save(
                DoFactory.createOrganisation(false, { itslearningEnabled: true }),
            );
            if (rolle instanceof DomainError) throw Error();

            await personenkontextRepoInternal.save(
                createPersonenkontext(false, {
                    rolleId: rolle.id,
                    personId: person.id,
                    organisationId: organisation.id,
                }),
            );

            let pks: Personenkontext<true>[];
            let cursor: string | undefined;

            [pks, cursor] = await sut.findWithRolleAtItslearningOrgaByCursor(rolle.id, 1, cursor);

            expect(pks).toHaveLength(1);
            expect(cursor).toBeDefined();

            [pks, cursor] = await sut.findWithRolleAtItslearningOrgaByCursor(rolle.id, 1, cursor);

            expect(pks).toHaveLength(0);
            expect(cursor).toBeUndefined();
        });

        it('should not return personenkontexte, when another with itslearning exists for the same person at the same orga', async () => {
            const person: Person<true> = await createPerson();
            const sp: ServiceProvider<true> = await serviceProviderRepo.save(
                DoFactory.createServiceProvider(false, { externalSystem: ServiceProviderSystem.ITSLEARNING }),
            );
            const rolleA: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, { serviceProviderIds: [sp.id] }),
            );
            const rolleB: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, { serviceProviderIds: [sp.id] }),
            );
            const organisation: Organisation<true> = await organisationRepository.save(
                DoFactory.createOrganisation(false, { itslearningEnabled: true }),
            );
            if (rolleA instanceof DomainError) throw Error();
            if (rolleB instanceof DomainError) throw Error();

            await personenkontextRepoInternal.save(
                createPersonenkontext(false, {
                    rolleId: rolleA.id,
                    personId: person.id,
                    organisationId: organisation.id,
                }),
            );
            await personenkontextRepoInternal.save(
                createPersonenkontext(false, {
                    rolleId: rolleB.id,
                    personId: person.id,
                    organisationId: organisation.id,
                }),
            );

            const [pks, cursor]: [Personenkontext<true>[], string | undefined] =
                await sut.findWithRolleAtItslearningOrgaByCursor(rolleA.id, 1);

            expect(pks).toHaveLength(0);
            expect(cursor).toBeUndefined();
        });
    });

    describe('find', () => {
        describe('when personenkontext exists', () => {
            it('should return a personenkontext by personId, organisationId, rolleId', async () => {
                const person: Person<true> = await createPerson();
                const organisation: Organisation<true> = await organisationRepository.save(
                    DoFactory.createOrganisation(false),
                );
                const rolle: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
                if (rolle instanceof DomainError) throw Error();

                await personenkontextRepoInternal.save(
                    createPersonenkontext(false, {
                        rolleId: rolle.id,
                        organisationId: organisation.id,
                        personId: person.id,
                    }),
                );
                const personenkontext: Option<Personenkontext<true>> = await sut.find(
                    person.id,
                    organisation.id,
                    rolle.id,
                );

                expect(personenkontext).toBeTruthy();
            });
        });

        describe('when personenkontext does NOT exist', () => {
            it('should return null', async () => {
                const personUUID: string = faker.string.uuid();
                const organisationUUID: string = faker.string.uuid();
                const rolle: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
                if (rolle instanceof DomainError) throw Error();

                const personenkontext: Option<Personenkontext<true>> = await sut.find(
                    personUUID,
                    organisationUUID,
                    rolle.id,
                );

                expect(personenkontext).toBeNull();
            });
        });
    });

    describe('findByIDAuthorized', () => {
        it('should succeed if the user is authorized', async () => {
            const person: Person<true> = await createPerson();
            const rootOrga: OrganisationID = (await createAndPersistRootOrganisation(em, organisationRepository)).id;
            const rolle: Rolle<true> = await createRolle(rootOrga, RollenArt.SYSADMIN, [
                RollenSystemRecht.PERSONEN_VERWALTEN,
            ]);
            const personenkontext: Personenkontext<true> = await personenkontextRepoInternal.save(
                createPersonenkontext(false, { personId: person.id, organisationId: rootOrga, rolleId: rolle.id }),
            );
            const permissions: PersonPermissions = createPermissions(person);

            const result: Result<Personenkontext<true>, DomainError> = await sut.findByIDAuthorized(
                personenkontext.id,
                permissions,
            );

            expect(result).toEqual({
                ok: true,
                value: expect.objectContaining(mapAggregateToPartial(personenkontext)) as Personenkontext<true>,
            });
        });

        it('should return EntityNotFoundError if not found', async () => {
            const person: Person<true> = await createPerson();
            const rootOrga: OrganisationID = (await createAndPersistRootOrganisation(em, organisationRepository)).id;
            const sysadmin: Rolle<true> = await createRolle(rootOrga, RollenArt.SYSADMIN, [
                RollenSystemRecht.PERSONEN_VERWALTEN,
            ]);
            await personenkontextRepoInternal.save(
                createPersonenkontext(false, { personId: person.id, organisationId: rootOrga, rolleId: sysadmin.id }),
            );
            const permissions: PersonPermissions = createPermissions(person);

            const id: PersonenkontextID = faker.string.uuid();

            const result: Result<Personenkontext<true>, DomainError> = await sut.findByIDAuthorized(id, permissions);

            expect(result).toEqual({
                ok: false,
                error: new EntityNotFoundError('Personenkontext', id),
            });
        });

        it('should return MissingPermissionsError if not authorized', async () => {
            const person: Person<true> = await createPerson();
            const schule: OrganisationID = (await createAndPersistOrganisation(em, undefined, OrganisationsTyp.SCHULE))
                .id;
            const lehrer: Rolle<true> = await createRolle(schule, RollenArt.LEHR, []);
            const personenkontext: Personenkontext<true> = await personenkontextRepoInternal.save(
                createPersonenkontext(false, { personId: person.id, organisationId: schule, rolleId: lehrer.id }),
            );
            const permissions: PersonPermissions = createPermissions(person);

            const result: Result<Personenkontext<true>, DomainError> = await sut.findByIDAuthorized(
                personenkontext.id,
                permissions,
            );

            expect(result).toEqual({
                ok: false,
                error: new MissingPermissionsError('Access denied'),
            });
        });
    });

    describe('isOrganisationAlreadyAssigned', () => {
        it('should return true if there is any personenkontext for an organisation', async () => {
            const person: Person<true> = await createPerson();
            const rolle: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
            if (rolle instanceof DomainError) throw Error();

            const organisation: Organisation<true> = await organisationRepository.save(
                DoFactory.createOrganisation(false),
            );
            await personenkontextRepoInternal.save(
                createPersonenkontext(false, {
                    rolleId: rolle.id,
                    personId: person.id,
                    organisationId: organisation.id,
                }),
            );

            const result: boolean = await sut.isOrganisationAlreadyAssigned(organisation.id);
            expect(result).toBeTruthy();
        });
    });

    describe('isRolleAlreadyAssigned', () => {
        it('should return true if there is any personenkontext for a rolle', async () => {
            const person: Person<true> = await createPerson();
            const rolle: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
            const organisation: Organisation<true> = await organisationRepository.save(
                DoFactory.createOrganisation(false),
            );
            if (rolle instanceof DomainError) throw Error();

            await personenkontextRepoInternal.save(
                createPersonenkontext(false, {
                    rolleId: rolle.id,
                    personId: person.id,
                    organisationId: organisation.id,
                }),
            );
            const result: boolean = await sut.isRolleAlreadyAssigned(rolle.id);

            expect(result).toBeTruthy();
        });

        it('should return false if there is no  personenkontext for an organisation', async () => {
            const result: boolean = await sut.isOrganisationAlreadyAssigned(faker.string.uuid());
            expect(result).toBeFalsy();
        });

        it('should return false if there is no  personenkontext for a rolle', async () => {
            const result: boolean = await sut.isRolleAlreadyAssigned(faker.string.uuid());

            expect(result).toBeFalsy();
        });
    });

    describe('getPersonenKontexteWithExpiredBefristung', () => {
        it('should return a grouped list of Personenkontext records with expired befristung', async () => {
            // Create a date 1 day in the past for testing
            const pastDate: Date = new Date();
            pastDate.setDate(pastDate.getDate() - 1);

            const futureDate: Date = new Date();
            futureDate.setDate(futureDate.getDate() + 1);

            const person1: Person<true> = await createPerson();
            const person2: Person<true> = await createPerson();
            const person3: Person<true> = await createPerson();

            const rolle1: Rolle<false> = DoFactory.createRolle(false, {
                name: 'rolle1',
                rollenart: RollenArt.EXTERN,
            });

            const organisation1: Organisation<true> = await organisationRepository.save(
                DoFactory.createOrganisation(false),
            );
            const organisation2: Organisation<true> = await organisationRepository.save(
                DoFactory.createOrganisation(false),
            );

            const rolle1Result: Rolle<true> | DomainError = await rolleRepo.save(rolle1);
            if (rolle1Result instanceof DomainError) throw Error();

            //Kontexte with exceeding Befristung
            const personenKontext1: Personenkontext<false> = DoFactory.createPersonenkontext(false, {
                personId: person1.id,
                rolleId: rolle1Result.id,
                organisationId: organisation1.id,
                befristung: pastDate,
            });

            const personenKontext2: Personenkontext<false> = DoFactory.createPersonenkontext(false, {
                personId: person2.id,
                rolleId: rolle1Result.id,
                organisationId: organisation1.id,
                befristung: pastDate,
            });

            //Kontexte without exceeding Befristung
            const personenKontext3: Personenkontext<false> = DoFactory.createPersonenkontext(false, {
                personId: person1.id,
                rolleId: rolle1Result.id,
                organisationId: organisation2.id,
                befristung: futureDate,
            });

            const personenKontext4: Personenkontext<false> = DoFactory.createPersonenkontext(false, {
                personId: person2.id,
                rolleId: rolle1Result.id,
                organisationId: organisation2.id,
                befristung: futureDate,
            });

            const personenKontext5: Personenkontext<false> = DoFactory.createPersonenkontext(false, {
                personId: person3.id,
                rolleId: rolle1Result.id,
                organisationId: organisation2.id,
                befristung: futureDate,
            });

            await personenkontextRepoInternal.save(personenKontext1);
            await personenkontextRepoInternal.save(personenKontext2);
            await personenkontextRepoInternal.save(personenKontext3);
            await personenkontextRepoInternal.save(personenKontext4);
            await personenkontextRepoInternal.save(personenKontext5);

            const result: Map<string, Personenkontext<true>[]> = await sut.getPersonenKontexteWithExpiredBefristung();

            expect(result.has(person1.id)).toBe(true);
            expect(result.get(person1.id)).toHaveLength(2);

            expect(result.has(person2.id)).toBe(true);
            expect(result.get(person2.id)).toHaveLength(2);
        });
    });

    describe('getPersonenkontextRollenCount', () => {
        it('should return the correct count of unique persons for a given role', async () => {
            const person: Person<true> = await createPerson();
            const rolle: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
            const organisation: Organisation<true> = await organisationRepository.save(
                DoFactory.createOrganisation(false),
            );
            if (rolle instanceof DomainError) throw Error();

            await personenkontextRepoInternal.save(
                createPersonenkontext(false, {
                    personId: person.id,
                    rolleId: rolle.id,
                    organisationId: organisation.id,
                }),
            );

            const rollenCount: RollenCount[] = await sut.getPersonenkontextRollenCount();
            expect(rollenCount.length).toBe(1);
            if (rollenCount.length > 0) {
                expect(rollenCount[0]!.count).toBe('1');
                expect(rollenCount[0]!.rollenart).toBe(rolle.rollenart);
            } else {
                throw Error();
            }
        });
    });

    describe('hasPersonASystemrechtAtAnyKontextOfPersonB', () => {
        it('should return true if person A has the required systemrecht at any kontext of person B', async () => {
            const personA: Person<true> = await createPerson();
            const personB: Person<true> = await createPerson();

            const rootOrga: OrganisationID = (await createAndPersistRootOrganisation(em, organisationRepository)).id;

            const rolleA: Rolle<true> = await createRolle(rootOrga, RollenArt.SYSADMIN, [
                RollenSystemRecht.PERSONEN_VERWALTEN,
            ]);
            const rolleB: Rolle<true> = await createRolle(rootOrga, RollenArt.LEHR, []);

            await personenkontextRepoInternal.save(
                createPersonenkontext(false, { personId: personA.id, organisationId: rootOrga, rolleId: rolleA.id }),
            );

            await personenkontextRepoInternal.save(
                createPersonenkontext(false, { personId: personB.id, organisationId: rootOrga, rolleId: rolleB.id }),
            );

            const result: boolean = await sut.hasPersonASystemrechtAtAnyKontextOfPersonB(
                personA.id,
                personB.id,
                RollenSystemRecht.PERSONEN_VERWALTEN,
            );

            expect(result).toBe(true);
        });

        it('should return false if person A does not have the required systemrecht at any kontext of person B', async () => {
            const personA: Person<true> = await createPerson();
            const personB: Person<true> = await createPerson();

            const rootOrga: OrganisationID = (await createAndPersistRootOrganisation(em, organisationRepository)).id;

            const rolleA: Rolle<true> = await createRolle(rootOrga, RollenArt.LEHR, []);
            const rolleB: Rolle<true> = await createRolle(rootOrga, RollenArt.LEHR, []);

            await personenkontextRepoInternal.save(
                createPersonenkontext(false, { personId: personA.id, organisationId: rootOrga, rolleId: rolleA.id }),
            );

            await personenkontextRepoInternal.save(
                createPersonenkontext(false, { personId: personB.id, organisationId: rootOrga, rolleId: rolleB.id }),
            );

            const result: boolean = await sut.hasPersonASystemrechtAtAnyKontextOfPersonB(
                personA.id,
                personB.id,
                RollenSystemRecht.PERSONEN_VERWALTEN,
            );

            expect(result).toBe(false);
        });
    });
});
