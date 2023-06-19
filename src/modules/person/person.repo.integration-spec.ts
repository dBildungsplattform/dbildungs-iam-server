import { fakerDE as faker } from '@faker-js/faker';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule, clearDatabase, setupDatabase } from '../../shared/index.js';
import { PersonEntity } from './person.entity.js';
import { PersonRepo } from './person.repo.js';

describe.skip('PersonRepo', () => {
    let module: TestingModule;
    let personRepo: PersonRepo;
    let orm: MikroORM;
    let em: EntityManager;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.register({ isDatabaseRequired: true })],
            providers: [PersonRepo],
        }).compile();
        personRepo = module.get(PersonRepo);
        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        await setupDatabase(orm);
    }, 30 * 1_000);

    afterAll(async () => {
        await module.close();
    }, 30 * 1_000);

    beforeEach(async () => {
        await clearDatabase(orm);
    });

    it('should be defined', () => {
        expect(personRepo).toBeDefined();
    });

    describe('save', () => {
        describe('when saving a person', () => {
            it('should persist the person to the db', async () => {
                const person = new PersonEntity();
                person.client = faker.company.name();
                person.firstName = faker.person.firstName();
                person.lastName = faker.person.lastName();
                await personRepo.save(person);
                await expect(em.find(PersonEntity, {})).resolves.toHaveLength(1);
            });
        });
    });

    describe('findById', () => {
        describe('when found by id', () => {
            let person: PersonEntity;

            beforeAll(async () => {
                person = new PersonEntity();
                person.client = faker.company.name();
                person.firstName = faker.person.firstName();
                person.lastName = faker.person.lastName();
                await em.persistAndFlush(person);
            });

            it('should return the found person', async () => {
                const foundPerson = await personRepo.findById(person.id);
                expect(foundPerson).toEqual(person);
            });
        });

        // describe('when not found by id', () => {
        //     it('should')
        // })
    });

    describe.skip('findByReferrer', () => {});

    describe.skip('remove', () => {});
});
