import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DatabaseTestModule,
    DoFactory,
    MapperTestModule,
} from '../../../../test/utils/index.js';
import { ScopeOrder } from '../../../shared/persistence/scope.enums.js';
import { PersonDo } from '../domain/person.do.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { PersonPersistenceMapperProfile } from './person-persistence.mapper.profile.js';
import { PersonEntity } from './person.entity.js';
import { PersonScope } from './person.scope.js';
import { faker } from '@faker-js/faker';
import { PersonenkontextDo } from '../../personenkontext/domain/personenkontext.do.js';
import { PersonenkontextEntity } from '../../personenkontext/persistence/personenkontext.entity.js';

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
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await orm.close();
        await module.close();
    });

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

        describe('when filtering for organisations', () => {
            beforeEach(async () => {
                const persons: PersonEntity[] = Array.from({ length: 110 }, () =>
                    mapper.map(DoFactory.createPerson(false), PersonDo, PersonEntity),
                );

                await em.persistAndFlush(persons);
            });

            it('should return found persons', async () => {
                const scope: PersonScope = new PersonScope()
                    .findBy({ organisationen: [] })
                    .sortBy('vorname', ScopeOrder.ASC)
                    .paged(10, 10);
                const [persons, total]: Counted<PersonEntity> = await scope.executeQuery(em);

                expect(total).toBe(0);
                expect(persons).toHaveLength(0);
            });
        });
        describe('findBy with orginisation id', () => {
            describe('when filtering for personenkontexte', () => {
                let organisation: OrganisationDo<true>;

                beforeEach(async () => {
                    const person: PersonDo<true> = DoFactory.createPerson(true);
                    await em.persistAndFlush(mapper.map(person, PersonDo, PersonEntity));

                    organisation = DoFactory.createOrganisation(true);

                    const dos: PersonenkontextDo<false> = DoFactory.createPersonenkontext<false>(false, {
                        personId: person.id,
                        organisation: organisation,
                    });

                    await em.persistAndFlush(mapper.map(dos, PersonenkontextDo, PersonenkontextEntity));
                });

                it('should return found persons', async () => {
                    const scope: PersonScope = new PersonScope()
                        .findBy({ organisationen: [organisation.id] })
                        .sortBy('vorname', ScopeOrder.ASC)
                        .paged(10, 10);
                    const [persons, total]: Counted<PersonEntity> = await scope.executeQuery(em);

                    expect(total).toBe(1);
                    expect(persons).toHaveLength(0);
                });
            });
        });

        describe('when filtering for ids', () => {
            const knownId: string = faker.string.uuid();
            beforeEach(async () => {
                const persons: PersonEntity[] = Array.from({ length: 9 }, () =>
                    mapper.map(DoFactory.createPerson(false), PersonDo, PersonEntity),
                );
                await em.persistAndFlush(persons);
                await em.persistAndFlush(
                    mapper.map(DoFactory.createPerson(true, { id: knownId }), PersonDo, PersonEntity),
                );
            });

            it('should return found persons', async () => {
                const scope: PersonScope = new PersonScope()
                    .findBy({ id: knownId })
                    .sortBy('vorname', ScopeOrder.ASC)
                    .paged(0, 10);
                const [persons, total]: Counted<PersonEntity> = await scope.executeQuery(em);

                expect(total).toBe(1);
                expect(persons).toHaveLength(1);
            });
        });
    });
});
