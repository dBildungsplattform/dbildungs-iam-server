import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule, DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { PersonDo } from '../domain/person.do.js';
import { PersonPersistenceMapperProfile } from './person-persistence.mapper.profile.js';
import { PersonEntity } from './person.entity.js';
import { PersonScope } from './person.scope.js';
import { ScopeOrder } from '../../../shared/persistence/scope.enums.js';

describe('PersonScope', () => {
    let module: TestingModule;
    let orm: MikroORM;
    let em: EntityManager;
    let mapper: Mapper;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true }), MapperTestModule],
            providers: [PersonPersistenceMapperProfile],
        }).compile();
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

    describe('findBy', () => {
        describe('when filtering for persons', () => {
            beforeEach(async () => {
                const persons: PersonEntity[] = Array.from({ length: 110 }, (_v: unknown, i: number) =>
                    mapper.map(DoFactory.createPerson(false, { vorname: `John #${i}` }), PersonDo, PersonEntity),
                );

                await em.persistAndFlush(persons);
            });

            it('should return found persons', async () => {
                const scope: PersonScope = new PersonScope()
                    .findBy({ vorname: new RegExp('John #1') })
                    .sortBy('vorname', ScopeOrder.ASC)
                    .paged(10, 10);
                const [persons, total]: Counted<PersonEntity> = await scope.executeQuery(em);

                expect(total).toBe(21);
                expect(persons).toHaveLength(10);
            });
        });
    });
});
