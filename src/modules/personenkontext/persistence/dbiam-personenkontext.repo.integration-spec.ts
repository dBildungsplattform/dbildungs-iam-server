import { faker } from '@faker-js/faker';
import { EntityManager, MikroORM, UniqueConstraintViolationException } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DoFactory,
    LoggingTestModule,
    MapperTestModule,
} from '../../../../test/utils/index.js';
import { Personenkontext, mapAggregateToPartial } from '../domain/personenkontext.js';
import { DBiamPersonenkontextRepo } from './dbiam-personenkontext.repo.js';
import { PersonPersistenceMapperProfile } from '../../person/persistence/person-persistence.mapper.profile.js';
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
import { OrganisationID, PersonenkontextID } from '../../../shared/types/aggregate-ids.types.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleFactory } from '../../rolle/domain/rolle.factory.js';
import { RollenArt, RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { createMock } from '@golevelup/ts-jest';
import { KeycloakUserService } from '../../keycloak-administration/index.js';
import { EntityAlreadyExistsError } from '../../../shared/error/entity-already-exists.error.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { PersonenkontextScope } from './personenkontext.scope.js';
import { MismatchedRevisionError } from '../../../shared/error/mismatched-revision.error.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';

describe('dbiam Personenkontext Repo', () => {
    let module: TestingModule;
    let sut: DBiamPersonenkontextRepo;
    let orm: MikroORM;
    let em: EntityManager;

    let personFactory: PersonFactory;
    let personRepo: PersonRepository;
    let organisationRepo: OrganisationRepo;
    let organisationRepository: OrganisationRepository;
    let rolleRepo: RolleRepo;
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
                PersonPersistenceMapperProfile,
                PersonFactory,
                PersonRepository,
                UsernameGeneratorService,
                RolleFactory,
                RolleRepo,
                ServiceProviderRepo,
                PersonenkontextFactory,
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
            ],
        }).compile();

        sut = module.get(DBiamPersonenkontextRepo);
        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        personFactory = module.get(PersonFactory);
        personRepo = module.get(PersonRepository);
        organisationRepo = module.get(OrganisationRepo);
        organisationRepository = module.get(OrganisationRepository);
        rolleRepo = module.get(RolleRepo);
        rolleFactory = module.get(RolleFactory);
        personenkontextFactory = module.get(PersonenkontextFactory);

        await DatabaseTestModule.setupDatabase(orm);
    }, 10000000);

    async function createPerson(): Promise<Person<true>> {
        const personResult: Person<false> | DomainError = await personFactory.createNew({
            vorname: faker.person.firstName(),
            familienname: faker.person.lastName(),
            username: faker.internet.userName(),
            password: faker.string.alphanumeric(8),
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

    async function createOrganisation(
        parentOrga: OrganisationID | undefined,
        isRoot: boolean,
        typ: OrganisationsTyp,
    ): Promise<OrganisationID> {
        const organisation: OrganisationDo<false> = DoFactory.createOrganisation(false, {
            administriertVon: parentOrga,
            zugehoerigZu: parentOrga,
            typ,
        });
        if (isRoot) organisation.id = organisationRepo.ROOT_ORGANISATION_ID;

        const result: OrganisationDo<true> = await organisationRepo.save(organisation);

        return result.id;
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
        );

        if (rolle instanceof DomainError) {
            throw rolle;
        }
        const result: Rolle<true> = await rolleRepo.save(rolle);
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
            const rolle: Rolle<true> = await rolleRepo.save(DoFactory.createRolle(false));
            const personenkontext: Personenkontext<true> = await sut.save(
                createPersonenkontext(false, { personId: person.id, rolleId: rolle.id }),
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

    describe('findBy', () => {
        describe('When personenkontext for person exists', () => {
            it('should find all personenkontexte for this person', async () => {
                const person: Person<true> = await createPerson();
                const rolleA: Rolle<true> = await rolleRepo.save(DoFactory.createRolle(false));
                const rolleB: Rolle<true> = await rolleRepo.save(DoFactory.createRolle(false));
                const personenkontextA: Personenkontext<true> = await sut.save(
                    createPersonenkontext(false, { personId: person.id, rolleId: rolleA.id }),
                );
                const personenkontextB: Personenkontext<true> = await sut.save(
                    createPersonenkontext(false, { personId: person.id, rolleId: rolleB.id }),
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
            const rolle: Rolle<true> = await rolleRepo.save(DoFactory.createRolle(false));

            await Promise.all([
                sut.save(createPersonenkontext(false, { personId: personA.id, rolleId: rolle.id })),
                sut.save(createPersonenkontext(false, { personId: personB.id, rolleId: rolle.id })),
            ]);

            const personenkontexte: Personenkontext<true>[] = await sut.findByPerson(personA.id);

            expect(personenkontexte).toHaveLength(1);
        });
    });

    describe('findByRolle', () => {
        it('should return all personenkontexte for a rolle', async () => {
            const person: Person<true> = await createPerson();
            const rolle: Rolle<true> = await rolleRepo.save(DoFactory.createRolle(false));

            await sut.save(createPersonenkontext(false, { rolleId: rolle.id, personId: person.id }));
            const personenkontexte: Personenkontext<true>[] = await sut.findByRolle(rolle.id);

            expect(personenkontexte).toHaveLength(1);
        });
    });

    describe('find', () => {
        describe('when personenkontext exists', () => {
            it('should return a personenkontext by personId, organisationId, rolleId', async () => {
                const person: Person<true> = await createPerson();
                const organisationUUID: string = faker.string.uuid();
                const rolle: Rolle<true> = await rolleRepo.save(DoFactory.createRolle(false));

                await sut.save(
                    createPersonenkontext(false, {
                        rolleId: rolle.id,
                        organisationId: organisationUUID,
                        personId: person.id,
                    }),
                );
                const personenkontext: Option<Personenkontext<true>> = await sut.find(
                    person.id,
                    organisationUUID,
                    rolle.id,
                );

                expect(personenkontext).toBeTruthy();
            });
        });

        describe('when personenkontext does NOT exist', () => {
            it('should return null', async () => {
                const personUUID: string = faker.string.uuid();
                const organisationUUID: string = faker.string.uuid();
                const rolle: Rolle<true> = await rolleRepo.save(DoFactory.createRolle(false));
                const personenkontext: Option<Personenkontext<true>> = await sut.find(
                    personUUID,
                    organisationUUID,
                    rolle.id,
                );

                expect(personenkontext).toBeNull();
            });
        });
    });

    describe('exists', () => {
        it('should return true, if the triplet exists', async () => {
            const person: Person<true> = await createPerson();
            const rolle: Rolle<true> = await rolleRepo.save(DoFactory.createRolle(false));
            const { personId, organisationId, rolleId }: Personenkontext<true> = await sut.save(
                createPersonenkontext(false, { personId: person.id, rolleId: rolle.id }),
            );

            const exists: boolean = await sut.exists(personId, organisationId, rolleId);

            expect(exists).toBe(true);
        });

        it('should return false, if the triplet does not exists', async () => {
            const exists: boolean = await sut.exists(faker.string.uuid(), faker.string.uuid(), faker.string.uuid());

            expect(exists).toBe(false);
        });
    });

    describe('save', () => {
        it('should save a new personenkontext', async () => {
            const person: Person<true> = await createPerson();
            const rolle: Rolle<true> = await rolleRepo.save(DoFactory.createRolle(false));
            const personenkontext: Personenkontext<false> = createPersonenkontext(false, {
                personId: person.id,
                rolleId: rolle.id,
            });

            const savedPersonenkontext: Personenkontext<true> = await sut.save(personenkontext);

            expect(savedPersonenkontext.id).toBeDefined();
        });

        it('should update an existing rolle', async () => {
            const person: Person<true> = await createPerson();
            const rolle: Rolle<true> = await rolleRepo.save(DoFactory.createRolle(false));
            const existingPersonenkontext: Personenkontext<true> = await sut.save(
                createPersonenkontext(false, { personId: person.id, rolleId: rolle.id }),
            );
            const update: Personenkontext<false> = createPersonenkontext(false);
            update.id = existingPersonenkontext.id;

            const savedPersonenkontext: Personenkontext<true> = await sut.save(existingPersonenkontext);

            expect(savedPersonenkontext).toMatchObject(mapAggregateToPartial(existingPersonenkontext));
        });

        it('should throw UniqueConstraintViolationException when triplet already exists', async () => {
            const person: Person<true> = await createPerson();
            const rolle: Rolle<true> = await rolleRepo.save(DoFactory.createRolle(false));
            const personenkontext: Personenkontext<false> = createPersonenkontext(false, {
                personId: person.id,
                rolleId: rolle.id,
            });
            await sut.save(personenkontext);

            await expect(sut.save(personenkontext)).rejects.toThrow(UniqueConstraintViolationException);
        });
    });

    describe('delete', () => {
        describe('when personenkontext is found', () => {
            it('should delete personenkontext', async () => {
                const person: Person<true> = await createPerson();
                const rolle: Rolle<true> = await rolleRepo.save(DoFactory.createRolle(false));

                const personenkontext: Personenkontext<false> = createPersonenkontext(false, {
                    personId: person.id,
                    rolleId: rolle.id,
                });
                const savedPersonenkontext: Personenkontext<true> = await sut.save(personenkontext);
                await expect(sut.delete(savedPersonenkontext)).resolves.not.toThrow();
            });
        });
    });

    describe('findByIDAuthorized', () => {
        it('should succeed if the user is authorized', async () => {
            const person: Person<true> = await createPerson();
            const rootOrga: OrganisationID = await createOrganisation(undefined, true, OrganisationsTyp.ROOT);
            const rolle: Rolle<true> = await createRolle(rootOrga, RollenArt.SYSADMIN, [
                RollenSystemRecht.PERSONEN_VERWALTEN,
            ]);
            const personenkontext: Personenkontext<true> = await sut.save(
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
            const rootOrga: OrganisationID = await createOrganisation(undefined, true, OrganisationsTyp.ROOT);
            const sysadmin: Rolle<true> = await createRolle(rootOrga, RollenArt.SYSADMIN, [
                RollenSystemRecht.PERSONEN_VERWALTEN,
            ]);
            await sut.save(
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
            const schule: OrganisationID = await createOrganisation(undefined, false, OrganisationsTyp.SCHULE);
            const lehrer: Rolle<true> = await createRolle(schule, RollenArt.LEHR, []);
            const personenkontext: Personenkontext<true> = await sut.save(
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

    describe('findByPersonAuthorized', () => {
        it('should return all personenkontexte for a person when authorized', async () => {
            const adminUser: Person<true> = await createPerson();
            const rootOrga: OrganisationID = await createOrganisation(undefined, true, OrganisationsTyp.ROOT);
            const schuleA: OrganisationID = await createOrganisation(rootOrga, false, OrganisationsTyp.SCHULE);
            const schuleB: OrganisationID = await createOrganisation(rootOrga, false, OrganisationsTyp.SCHULE);
            const lehrerRolle: Rolle<true> = await createRolle(rootOrga, RollenArt.LEHR, []);
            const adminRolle: Rolle<true> = await createRolle(rootOrga, RollenArt.SYSADMIN, [
                RollenSystemRecht.PERSONEN_VERWALTEN,
            ]);

            await sut.save(
                createPersonenkontext(false, {
                    personId: adminUser.id,
                    organisationId: rootOrga,
                    rolleId: adminRolle.id,
                }),
            );

            const personA: Person<true> = await createPerson();
            const personB: Person<true> = await createPerson();

            const [kontext1, kontext2]: [Personenkontext<true>, Personenkontext<true>, Personenkontext<true>] =
                await Promise.all([
                    sut.save(
                        createPersonenkontext(false, {
                            personId: personA.id,
                            rolleId: lehrerRolle.id,
                            organisationId: schuleA,
                        }),
                    ),
                    sut.save(
                        createPersonenkontext(false, {
                            personId: personA.id,
                            rolleId: lehrerRolle.id,
                            organisationId: schuleB,
                        }),
                    ),
                    sut.save(
                        createPersonenkontext(false, {
                            personId: personB.id,
                            rolleId: lehrerRolle.id,
                            organisationId: schuleA,
                        }),
                    ),
                ]);

            const permissions: PersonPermissions = createPermissions(adminUser);

            const result: Result<Personenkontext<true>[], DomainError> = await sut.findByPersonAuthorized(
                personA.id,
                permissions,
            );

            expect(result).toEqual({
                ok: true,
                value: expect.arrayContaining([
                    expect.objectContaining(mapAggregateToPartial(kontext1)),
                    expect.objectContaining(mapAggregateToPartial(kontext2)),
                ]) as Personenkontext<true>[],
            });
        });

        it('should return MissingPermissionsError when user is not authorized', async () => {
            const person: Person<true> = await createPerson();
            const permissions: PersonPermissions = createPermissions(person);

            const result: Result<Personenkontext<true>[], DomainError> = await sut.findByPersonAuthorized(
                person.id,
                permissions,
            );

            expect(result).toEqual({
                ok: false,
                error: new MissingPermissionsError('Not allowed to view the requested personenkontexte'),
            });
        });

        it('should return empty array, when person has no kontexte but user is admin', async () => {
            const adminUser: Person<true> = await createPerson();
            const rootOrga: OrganisationID = await createOrganisation(undefined, true, OrganisationsTyp.ROOT);
            const adminRolle: Rolle<true> = await createRolle(rootOrga, RollenArt.SYSADMIN, [
                RollenSystemRecht.PERSONEN_VERWALTEN,
            ]);
            await sut.save(
                createPersonenkontext(false, {
                    personId: adminUser.id,
                    organisationId: rootOrga,
                    rolleId: adminRolle.id,
                }),
            );
            const person: Person<true> = await createPerson();
            const permissions: PersonPermissions = createPermissions(adminUser);

            const result: Result<Personenkontext<true>[], DomainError> = await sut.findByPersonAuthorized(
                person.id,
                permissions,
            );

            expect(result).toEqual({
                ok: true,
                value: [],
            });
        });
    });

    describe('saveAuthorized', () => {
        it('should save kontext when authorized', async () => {
            const adminUser: Person<true> = await createPerson();
            const rootOrga: OrganisationID = await createOrganisation(undefined, true, OrganisationsTyp.ROOT);
            const adminRolle: Rolle<true> = await createRolle(rootOrga, RollenArt.SYSADMIN, [
                RollenSystemRecht.PERSONEN_VERWALTEN,
            ]);
            await sut.save(
                createPersonenkontext(false, {
                    personId: adminUser.id,
                    organisationId: rootOrga,
                    rolleId: adminRolle.id,
                }),
            );

            const person: Person<true> = await createPerson();
            const schule: OrganisationID = await createOrganisation(rootOrga, false, OrganisationsTyp.SCHULE);
            const lehrerRolle: Rolle<true> = await createRolle(rootOrga, RollenArt.LEHR, []);

            const personenkontext: Personenkontext<false> = createPersonenkontext(false, {
                personId: person.id,
                organisationId: schule,
                rolleId: lehrerRolle.id,
            });

            const permissions: PersonPermissions = createPermissions(adminUser);

            const result: Result<Personenkontext<true>, DomainError> = await sut.saveAuthorized(
                personenkontext,
                permissions,
            );

            expect(result).toEqual({
                ok: true,
                value: expect.any(Personenkontext) as Personenkontext<true>,
            });
        });

        it('should return error, if references are invalid', async () => {
            const adminUser: Person<true> = await createPerson();
            const rootOrga: OrganisationID = await createOrganisation(undefined, true, OrganisationsTyp.ROOT);
            const adminRolle: Rolle<true> = await createRolle(rootOrga, RollenArt.SYSADMIN, [
                RollenSystemRecht.PERSONEN_VERWALTEN,
            ]);
            await sut.save(
                createPersonenkontext(false, {
                    personId: adminUser.id,
                    organisationId: rootOrga,
                    rolleId: adminRolle.id,
                }),
            );

            const personenkontext: Personenkontext<false> = createPersonenkontext(false, {
                personId: faker.string.uuid(),
                organisationId: faker.string.uuid(),
                rolleId: faker.string.uuid(),
            });

            const permissions: PersonPermissions = createPermissions(adminUser);

            const result: Result<Personenkontext<true>, DomainError> = await sut.saveAuthorized(
                personenkontext,
                permissions,
            );

            expect(result).toEqual({
                ok: false,
                error: new EntityNotFoundError('Person', personenkontext.personId),
            });
        });

        it('should save kontext when authorized', async () => {
            const userWithoutPermission: Person<true> = await createPerson();
            const rootOrga: OrganisationID = await createOrganisation(undefined, true, OrganisationsTyp.ROOT);
            const adminRolle: Rolle<true> = await createRolle(rootOrga, RollenArt.SYSADMIN, []);
            await sut.save(
                createPersonenkontext(false, {
                    personId: userWithoutPermission.id,
                    organisationId: rootOrga,
                    rolleId: adminRolle.id,
                }),
            );

            const person: Person<true> = await createPerson();
            const schule: OrganisationID = await createOrganisation(rootOrga, false, OrganisationsTyp.SCHULE);
            const lehrerRolle: Rolle<true> = await createRolle(rootOrga, RollenArt.LEHR, []);

            const personenkontext: Personenkontext<false> = createPersonenkontext(false, {
                personId: person.id,
                organisationId: schule,
                rolleId: lehrerRolle.id,
            });

            const permissions: PersonPermissions = createPermissions(userWithoutPermission);

            const result: Result<Personenkontext<true>, DomainError> = await sut.saveAuthorized(
                personenkontext,
                permissions,
            );

            expect(result).toEqual({
                ok: false,
                error: new MissingPermissionsError('Unauthorized to manage persons at the organisation'),
            });
        });

        it('should return error if it already exists', async () => {
            const adminUser: Person<true> = await createPerson();
            const rootOrga: OrganisationID = await createOrganisation(undefined, true, OrganisationsTyp.ROOT);
            const adminRolle: Rolle<true> = await createRolle(rootOrga, RollenArt.SYSADMIN, [
                RollenSystemRecht.PERSONEN_VERWALTEN,
            ]);
            await sut.save(
                createPersonenkontext(false, {
                    personId: adminUser.id,
                    organisationId: rootOrga,
                    rolleId: adminRolle.id,
                }),
            );

            const person: Person<true> = await createPerson();
            const schule: OrganisationID = await createOrganisation(rootOrga, false, OrganisationsTyp.SCHULE);
            const lehrerRolle: Rolle<true> = await createRolle(rootOrga, RollenArt.LEHR, []);

            const personenkontext: Personenkontext<false> = createPersonenkontext(false, {
                personId: person.id,
                organisationId: schule,
                rolleId: lehrerRolle.id,
            });
            await sut.save(personenkontext);

            const permissions: PersonPermissions = createPermissions(adminUser);

            const result: Result<Personenkontext<true>, DomainError> = await sut.saveAuthorized(
                personenkontext,
                permissions,
            );

            expect(result).toEqual({
                ok: false,
                error: new EntityAlreadyExistsError('Personenkontext already exists'),
            });
        });
    });

    describe('deleteAuthorized', () => {
        it('should delete kontext when authorized', async () => {
            const adminUser: Person<true> = await createPerson();
            const rootOrga: OrganisationID = await createOrganisation(undefined, true, OrganisationsTyp.ROOT);
            const adminRolle: Rolle<true> = await createRolle(rootOrga, RollenArt.SYSADMIN, [
                RollenSystemRecht.PERSONEN_VERWALTEN,
            ]);
            await sut.save(
                createPersonenkontext(false, {
                    personId: adminUser.id,
                    organisationId: rootOrga,
                    rolleId: adminRolle.id,
                }),
            );

            const person: Person<true> = await createPerson();
            const schule: OrganisationID = await createOrganisation(rootOrga, false, OrganisationsTyp.SCHULE);
            const lehrerRolle: Rolle<true> = await createRolle(rootOrga, RollenArt.LEHR, []);

            const personenkontext: Personenkontext<true> = await sut.save(
                createPersonenkontext(false, {
                    personId: person.id,
                    organisationId: schule,
                    rolleId: lehrerRolle.id,
                }),
            );

            const permissions: PersonPermissions = createPermissions(adminUser);

            const result: Option<DomainError> = await sut.deleteAuthorized(personenkontext.id, '1', permissions);

            expect(result).toBeUndefined();
        });

        it('should return EntityNotFoundError if the kontext does not exist', async () => {
            const adminUser: Person<true> = await createPerson();
            const rootOrga: OrganisationID = await createOrganisation(undefined, true, OrganisationsTyp.ROOT);
            const adminRolle: Rolle<true> = await createRolle(rootOrga, RollenArt.SYSADMIN, [
                RollenSystemRecht.PERSONEN_VERWALTEN,
            ]);
            await sut.save(
                createPersonenkontext(false, {
                    personId: adminUser.id,
                    organisationId: rootOrga,
                    rolleId: adminRolle.id,
                }),
            );

            const permissions: PersonPermissions = createPermissions(adminUser);

            const id: string = faker.string.uuid();

            const result: Option<DomainError> = await sut.deleteAuthorized(id, '1', permissions);

            expect(result).toEqual(new EntityNotFoundError('Personenkontext', id));
        });

        it('should return MissingPermissionsError if not authorized', async () => {
            const adminUser: Person<true> = await createPerson();
            const rootOrga: OrganisationID = await createOrganisation(undefined, true, OrganisationsTyp.ROOT);
            const adminRolle: Rolle<true> = await createRolle(rootOrga, RollenArt.SYSADMIN, []);
            await sut.save(
                createPersonenkontext(false, {
                    personId: adminUser.id,
                    organisationId: rootOrga,
                    rolleId: adminRolle.id,
                }),
            );

            const person: Person<true> = await createPerson();
            const schule: OrganisationID = await createOrganisation(rootOrga, false, OrganisationsTyp.SCHULE);
            const lehrerRolle: Rolle<true> = await createRolle(rootOrga, RollenArt.LEHR, []);

            const personenkontext: Personenkontext<true> = await sut.save(
                createPersonenkontext(false, {
                    personId: person.id,
                    organisationId: schule,
                    rolleId: lehrerRolle.id,
                }),
            );

            const permissions: PersonPermissions = createPermissions(adminUser);

            const result: Option<DomainError> = await sut.deleteAuthorized(personenkontext.id, '1', permissions);

            expect(result).toEqual(new MissingPermissionsError('Access denied'));
        });

        it('should delete kontext when authorized', async () => {
            const adminUser: Person<true> = await createPerson();
            const rootOrga: OrganisationID = await createOrganisation(undefined, true, OrganisationsTyp.ROOT);
            const adminRolle: Rolle<true> = await createRolle(rootOrga, RollenArt.SYSADMIN, [
                RollenSystemRecht.PERSONEN_VERWALTEN,
            ]);
            await sut.save(
                createPersonenkontext(false, {
                    personId: adminUser.id,
                    organisationId: rootOrga,
                    rolleId: adminRolle.id,
                }),
            );

            const person: Person<true> = await createPerson();
            const schule: OrganisationID = await createOrganisation(rootOrga, false, OrganisationsTyp.SCHULE);
            const lehrerRolle: Rolle<true> = await createRolle(rootOrga, RollenArt.LEHR, []);

            const personenkontext: Personenkontext<true> = await sut.save(
                createPersonenkontext(false, {
                    personId: person.id,
                    organisationId: schule,
                    rolleId: lehrerRolle.id,
                }),
            );

            const permissions: PersonPermissions = createPermissions(adminUser);

            const result: Option<DomainError> = await sut.deleteAuthorized(personenkontext.id, '2', permissions);

            expect(result).toEqual(new MismatchedRevisionError('Personenkontext'));
        });
    });

    describe('isRolleAlreadyAssigned', () => {
        it('should return true if there is any personenkontext for a rolle', async () => {
            const person: Person<true> = await createPerson();
            const rolle: Rolle<true> = await rolleRepo.save(DoFactory.createRolle(false));

            await sut.save(createPersonenkontext(false, { rolleId: rolle.id, personId: person.id }));
            const result: boolean = await sut.isRolleAlreadyAssigned(rolle.id);

            expect(result).toBeTruthy();
        });

        it('should return false if there is no  personenkontext for a rolle', async () => {
            const result: boolean = await sut.isRolleAlreadyAssigned(faker.string.uuid());

            expect(result).toBeFalsy();
        });
    });

    describe('deleteById', () => {
        describe('when deleting personenkontext by id', () => {
            it('should return number of deleted rows', async () => {
                const person: Person<true> = await createPerson();
                const rolle: Rolle<true> = await rolleRepo.save(DoFactory.createRolle(false));

                const personenKontext: Personenkontext<true> = await sut.save(
                    createPersonenkontext(false, { rolleId: rolle.id, personId: person.id }),
                );

                const result: boolean = await sut.deleteById(personenKontext.id);

                expect(result).toBeTruthy();
            });
        });

        describe('when no personenkontext was deleted', () => {
            it('should return 0', async () => {
                const result: boolean = await sut.deleteById(faker.string.uuid());

                expect(result).toBeFalsy();
            });
        });
    });
});
