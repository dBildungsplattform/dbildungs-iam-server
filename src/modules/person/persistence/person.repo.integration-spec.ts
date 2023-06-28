import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { fakerDE as faker } from '@faker-js/faker';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule, DoFactory, MapperTestModule } from '../../../shared/testing/index.js';
import { PersonMapperProfile } from '../person.mapper.profile.js';
import { PersonEntity } from './person.entity.js';
import { PersonRepo } from './person.repo.js';
import { PersonDo } from '../domain/person.do.js';

describe('PersonRepo', () => {
    let module: TestingModule;
    let sut: PersonRepo;
    let orm: MikroORM;
    let em: EntityManager;
    let mapper: Mapper;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.register({ isDatabaseRequired: true }), MapperTestModule],
            providers: [PersonMapperProfile, PersonRepo],
        }).compile();
        sut = module.get(PersonRepo);
        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        mapper = module.get(getMapperToken());
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
                const person = DoFactory.createPerson(false, { referrer: faker.string.uuid() });
                await sut.save(person);
                await expect(em.find(PersonEntity, {})).resolves.toHaveLength(1);
            });
        });

        describe('when updating person', () => {
            it('should persist person into database', async () => {
                const person = DoFactory.createPerson(false, { referrer: faker.string.uuid() });
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
                const person = DoFactory.createPerson(true, { referrer: faker.string.uuid() });
                await em.persistAndFlush(mapper.map(person, PersonDo, PersonEntity));
                const foundPerson = await sut.findById(person.id);
                expect(foundPerson).toBeDefined();
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
                const person = DoFactory.createPerson(true, { referrer: faker.string.uuid() });
                await em.persistAndFlush(mapper.map(person, PersonDo, PersonEntity));
                const foundPerson = await sut.findByReferrer(person.referrer as string);
                expect(foundPerson).toBeDefined();
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
                const person = DoFactory.createPerson(true, { referrer: faker.string.uuid() });
                await em.persistAndFlush(mapper.map(person, PersonDo, PersonEntity));
                await expect(em.find(PersonEntity, {})).resolves.toHaveLength(1);
                await sut.delete(person);
                await expect(em.find(PersonEntity, {})).resolves.toHaveLength(0);
            });
        });
    });
});
