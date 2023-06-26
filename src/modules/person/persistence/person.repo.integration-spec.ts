import { fakerDE as faker } from '@faker-js/faker';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule, MapperTestModule } from '../../../shared/index.js';
import { PersonEntity } from './person.entity.js';
import { PersonRepo } from './person.repo.js';
import { PersonMapperProfile } from '../person.mapper.profile.js';

describe('PersonRepo', () => {
    let module: TestingModule;
    let sut: PersonRepo;
    let orm: MikroORM;
    let em: EntityManager;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.register({ isDatabaseRequired: true }), MapperTestModule],
            providers: [PersonMapperProfile, PersonRepo],
        }).compile();
        sut = module.get(PersonRepo);
        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        await DatabaseTestModule.setupDatabase(orm);
    }, 30 * 1_000);

    afterAll(async () => {
        await module.close();
    }, 30 * 1_000);

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('save', () => {
        describe('when creating person', () => {
            it('should persist person into database', async () => {
                const person = new PersonEntity();
                person.client = faker.company.name();
                person.firstName = faker.person.firstName();
                person.lastName = faker.person.lastName();
                await sut.save(person);
                await expect(em.find(PersonEntity, {})).resolves.toHaveLength(1);
            });
        });

        describe('when updating person', () => {
            it('should persist person into database', async () => {
                const person = new PersonEntity();
                person.client = faker.company.name();
                person.firstName = faker.person.firstName();
                person.lastName = faker.person.lastName();
                await sut.save(person);
                await expect(em.find(PersonEntity, {})).resolves.toHaveLength(1);
                person.referrer = faker.string.uuid();
                await sut.save(person);
                await expect(em.find(PersonEntity, { referrer: person.referrer })).resolves.toHaveLength(1);
            });
        });
    });

    describe('findById', () => {
        describe('when found by id', () => {
            it('should return found person', async () => {
                const person = new PersonEntity();
                person.client = faker.company.name();
                person.firstName = faker.person.firstName();
                person.lastName = faker.person.lastName();
                await em.persistAndFlush(person);
                const foundPerson = await sut.findById(person.id);
                expect(foundPerson).toEqual(person);
            });
        });

        describe('when not found by id', () => {
            it('should return null or undefined', async () => {
                const foundPerson = await sut.findById(faker.string.uuid());
                expect(foundPerson).toBeFalsy();
            });
        });
    });

    describe('findByReferrer', () => {
        describe('when found by referrer', () => {
            it('should return found person', async () => {
                const person = new PersonEntity();
                person.client = faker.company.name();
                person.firstName = faker.person.firstName();
                person.lastName = faker.person.lastName();
                person.referrer = faker.string.uuid();
                await em.persistAndFlush(person);
                const foundPerson = await sut.findByReferrer(person.referrer);
                expect(foundPerson).toEqual(person);
            });
        });

        describe('when not found by referrer', () => {
            it('should return null or undefined', async () => {
                const foundPerson = await sut.findByReferrer(faker.string.uuid());
                expect(foundPerson).toBeFalsy();
            });
        });
    });

    describe('delete', () => {
        describe('when deleting a person', () => {
            it('should delete person into database', async () => {
                const person = new PersonEntity();
                person.client = faker.company.name();
                person.firstName = faker.person.firstName();
                person.lastName = faker.person.lastName();
                await em.persistAndFlush(person);
                await expect(em.find(PersonEntity, {})).resolves.toHaveLength(1);
                await sut.delete(person);
                await expect(em.find(PersonEntity, {})).resolves.toHaveLength(0);
            });
        });
    });
});
