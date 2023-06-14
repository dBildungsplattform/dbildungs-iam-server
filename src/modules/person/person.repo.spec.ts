import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, ContainerFactory, DatabaseTestModule } from '../../shared/index.js';
import { PersonEntity } from './person.entity.js';
import { PersonRepo } from './person.repo.js';

describe.skip('PersonRepo', () => {
    let module: TestingModule;
    let em: EntityManager;
    let personRepo: PersonRepo;

    beforeAll(async () => {
        await ContainerFactory.createPostgres();
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule],
        }).compile();
        em = module.get(EntityManager);
        personRepo = module.get(PersonRepo);
    }, 10 * 60 * 1000);

    afterAll(async () => {
        await module.close();
        await ContainerFactory.close();
    });

    afterEach(async () => {
        const persons = em.find(PersonEntity, {});
        await em.removeAndFlush(persons);
    });

    describe('save', () => {
        describe('when saving a person', () => {
            it('should persist the person to the db', async () => {
                const person = new PersonEntity();
                await personRepo.save(person);
                await expect(em.find(PersonEntity, {})).resolves.toHaveLength(1);
            });
        });
    });

    describe('findById', () => {});

    describe('findByReferrer', () => {});

    describe('remove', () => {});
});
