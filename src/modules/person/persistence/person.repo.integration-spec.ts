import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { faker } from '@faker-js/faker';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DatabaseTestModule,
    MapperTestModule,
} from '../../../../test/utils/index.js';
import { PersonDo } from '../domain/person.do.js';
import { PersonEntity } from './person.entity.js';
import { PersonRepo } from './person.repo.js';
import { PersonPersistenceMapperProfile } from './person-persistence.mapper.profile.js';

describe('PersonRepo', () => {
    let module: TestingModule;
    let sut: PersonRepo;
    let orm: MikroORM;
    let em: EntityManager;
    let mapper: Mapper;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true }), MapperTestModule],
            providers: [PersonPersistenceMapperProfile, PersonRepo],
        }).compile();
        sut = module.get(PersonRepo);
        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        mapper = module.get(getMapperToken());
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
    });

    describe('findById', () => {
        describe('when found by id', () => {
            it('should return found person', async () => {
                const personDo: PersonDo<false> = {
                    keycloakUserId: faker.string.uuid(),
                    mandant: faker.string.uuid(),
                    referrer: faker.string.uuid(),
                    familienname: faker.person.lastName(),
                    vorname: faker.person.fullName(),
                    id: faker.string.uuid(),
                    createdAt: faker.date.past(),
                    updatedAt: faker.date.recent(),
                    revision: '1',
                };
                await em.persistAndFlush(mapper.map(personDo, PersonDo, PersonEntity));

                const [person]: PersonEntity[] = await em.find(PersonEntity, {});
                expect(person).toBeInstanceOf(PersonEntity);

                const foundPerson: Option<PersonDo<true>> = await sut.findById((person as PersonEntity).id);
                expect(foundPerson).toBeInstanceOf(PersonDo);
            });
        });

        describe('when not found by id', () => {
            it('should return null', async () => {
                const foundPerson: Option<PersonDo<true>> = await sut.findById(faker.string.uuid());
                expect(foundPerson).toBeNull();
            });
        });
    });
});
