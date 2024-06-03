import { faker } from '@faker-js/faker';
import { EntityManager, MikroORM, UniqueConstraintViolationException } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DoFactory,
    KeycloakConfigTestModule,
    MapperTestModule,
} from '../../../../test/utils/index.js';
import { Personenkontext } from '../domain/personenkontext.js';
import { DBiamPersonenkontextRepo } from './dbiam-personenkontext.repo.js';
import { PersonPersistenceMapperProfile } from '../../person/persistence/person-persistence.mapper.profile.js';
import { KeycloakAdministrationModule } from '../../keycloak-administration/keycloak-administration.module.js';
import { UsernameGeneratorService } from '../../person/domain/username-generator.service.js';
import { PersonFactory } from '../../person/domain/person.factory.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { Person } from '../../person/domain/person.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { KeycloakConfigModule } from '../../keycloak-administration/keycloak-config.module.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { RolleFactory } from '../../rolle/domain/rolle.factory.js';

function createPersonenkontext<WasPersisted extends boolean>(
    this: void,
    withId: WasPersisted,
    params: Partial<Personenkontext<boolean>> = {},
): Personenkontext<WasPersisted> {
    const personenkontext: Personenkontext<WasPersisted> = Personenkontext.construct<boolean>(
        withId ? faker.string.uuid() : undefined,
        withId ? faker.date.past() : undefined,
        withId ? faker.date.recent() : undefined,
        faker.string.uuid(),
        faker.string.uuid(),
        faker.string.uuid(),
    );

    Object.assign(personenkontext, params);

    return personenkontext;
}

describe('dbiam Personenkontext Repo', () => {
    let module: TestingModule;
    let sut: DBiamPersonenkontextRepo;
    let orm: MikroORM;
    let em: EntityManager;

    let personFactory: PersonFactory;
    let personRepo: PersonRepository;
    let rolleRepo: RolleRepo;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                MapperTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                KeycloakAdministrationModule,
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
            ],
        })
            .overrideModule(KeycloakConfigModule)
            .useModule(KeycloakConfigTestModule.forRoot({ isKeycloakRequired: true }))
            .compile();

        sut = module.get(DBiamPersonenkontextRepo);
        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        personFactory = module.get(PersonFactory);
        personRepo = module.get(PersonRepository);
        rolleRepo = module.get(RolleRepo);

        await DatabaseTestModule.setupDatabase(orm);
    }, 10000000);

    async function createPerson(): Promise<Person<true>> {
        const personResult: Person<false> | DomainError = await personFactory.createNew({
            vorname: faker.person.firstName(),
            familienname: faker.person.lastName(),
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

            expect(savedPersonenkontext).toEqual(existingPersonenkontext);
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
});
