import { fakerDE as faker } from '@faker-js/faker';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule } from '../../shared/index.js';
import { PersonEntity } from './person.entity.js';
import { PersonRepo } from './person.repo.js';

describe('PersonRepo', () => {
    let module: TestingModule;
    let personRepo: PersonRepo;
    let orm: MikroORM;
    let em: EntityManager;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule],
            providers: [PersonRepo],
        }).compile();
        personRepo = module.get(PersonRepo);
        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        await orm.getSchemaGenerator().createSchema();
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(async () => {
        const generator = orm.getSchemaGenerator();
        await generator.clearDatabase();
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

    describe('findById', () => {});

    describe('findByReferrer', () => {});

    describe('remove', () => {});
});
