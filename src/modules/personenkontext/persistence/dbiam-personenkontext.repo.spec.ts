import { faker } from '@faker-js/faker';
import { EntityManager, MikroORM, UniqueConstraintViolationException } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DatabaseTestModule,
    DoFactory,
    MapperTestModule,
} from '../../../../test/utils/index.js';
import { Personenkontext } from '../domain/personenkontext.js';
import { DBiamPersonenkontextRepo } from './dbiam-personenkontext.repo.js';
import { PersonRepo } from '../../person/persistence/person.repo.js';
import { PersonDo } from '../../person/domain/person.do.js';
import { PersonPersistenceMapperProfile } from '../../person/persistence/person-persistence.mapper.profile.js';

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

    let personRepo: PersonRepo;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, MapperTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true })],
            providers: [DBiamPersonenkontextRepo, PersonPersistenceMapperProfile, PersonRepo],
        }).compile();

        sut = module.get(DBiamPersonenkontextRepo);
        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        personRepo = module.get(PersonRepo);

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

    describe('findByPerson', () => {
        it('should return all personenkontexte for a person', async () => {
            const personA: PersonDo<true> = await personRepo.save(DoFactory.createPerson(false));
            const personB: PersonDo<true> = await personRepo.save(DoFactory.createPerson(false));

            await Promise.all([
                sut.save(createPersonenkontext(false, { personId: personA.id })),
                sut.save(createPersonenkontext(false, { personId: personB.id })),
            ]);

            const personenkontexte: Personenkontext<true>[] = await sut.findByPerson(personA.id);

            expect(personenkontexte).toHaveLength(1);
        });
    });

    describe('findByRolle', () => {
        it('should return all personenkontexte for a rolle', async () => {
            const person: PersonDo<true> = await personRepo.save(DoFactory.createPerson(false));
            const rolleUUID: string = faker.string.uuid();
            await sut.save(createPersonenkontext(false, { rolleId: rolleUUID, personId: person.id }));
            const personenkontexte: Personenkontext<true>[] = await sut.findByRolle(rolleUUID);
            expect(personenkontexte).toHaveLength(1);
        });
    });

    describe('exists', () => {
        it('should return true, if the triplet exists', async () => {
            const person: PersonDo<true> = await personRepo.save(DoFactory.createPerson(false));
            const { personId, organisationId, rolleId }: Personenkontext<true> = await sut.save(
                createPersonenkontext(false, { personId: person.id }),
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
            const person: PersonDo<true> = await personRepo.save(DoFactory.createPerson(false));
            const personenkontext: Personenkontext<false> = createPersonenkontext(false, { personId: person.id });

            const savedPersonenkontext: Personenkontext<true> = await sut.save(personenkontext);

            expect(savedPersonenkontext.id).toBeDefined();
        });

        it('should update an existing rolle', async () => {
            const person: PersonDo<true> = await personRepo.save(DoFactory.createPerson(false));
            const existingPersonenkontext: Personenkontext<true> = await sut.save(
                createPersonenkontext(false, { personId: person.id }),
            );
            const update: Personenkontext<false> = createPersonenkontext(false);
            update.id = existingPersonenkontext.id;

            const savedPersonenkontext: Personenkontext<true> = await sut.save(existingPersonenkontext);

            expect(savedPersonenkontext).toEqual(existingPersonenkontext);
        });

        it('should throw UniqueConstraintViolationException when triplet already exists', async () => {
            const person: PersonDo<true> = await personRepo.save(DoFactory.createPerson(false));
            const personenkontext: Personenkontext<false> = createPersonenkontext(false, { personId: person.id });
            await sut.save(personenkontext);

            await expect(sut.save(personenkontext)).rejects.toThrow(UniqueConstraintViolationException);
        });
    });
});
