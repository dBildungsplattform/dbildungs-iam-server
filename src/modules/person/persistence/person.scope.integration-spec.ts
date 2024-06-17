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
import { PersonEntity } from './person.entity.js';
import { PersonScope } from './person.scope.js';
import { faker } from '@faker-js/faker';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleFactory } from '../../rolle/domain/rolle.factory.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { PersonenkontextFactory } from '../../personenkontext/domain/personenkontext.factory.js';
import { PersonenKontextModule } from '../../personenkontext/personenkontext.module.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';

describe('PersonScope', () => {
    let module: TestingModule;
    let orm: MikroORM;
    let em: EntityManager;
    let mapper: Mapper;
    let kontextRepo: DBiamPersonenkontextRepo;
    let rolleRepo: RolleRepo;
    let personenkontextFactory: PersonenkontextFactory;

    const createPersonEntity = (): PersonEntity => {
        const person: PersonEntity = mapper.map(DoFactory.createPerson(false), PersonDo, PersonEntity);
        return person;
    };

    const createPersonenkontext = async (personId: string, orgnisationID: string, rolleID: string): Promise<void> => {
        const personkentext: Personenkontext<false> = personenkontextFactory.createNew(
            personId,
            orgnisationID,
            rolleID,
        );
        await kontextRepo.save(personkentext);
    };

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                MapperTestModule,
                PersonenKontextModule,
            ],
            providers: [DBiamPersonenkontextRepo, RolleRepo, RolleFactory, ServiceProviderRepo, OrganisationRepository],
        }).compile();
        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        mapper = module.get(getMapperToken());
        kontextRepo = module.get(DBiamPersonenkontextRepo);
        rolleRepo = module.get(RolleRepo);
        personenkontextFactory = module.get(PersonenkontextFactory);

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

        describe('when filtering by birthday', () => {
            const birthday: Date = faker.date.past();

            beforeEach(async () => {
                const persons: PersonEntity[] = Array.from({ length: 20 }, () =>
                    mapper.map(DoFactory.createPerson(false, { geburtsdatum: birthday }), PersonDo, PersonEntity),
                );

                await em.persistAndFlush(persons);
            });

            it('should return found persons', async () => {
                const scope: PersonScope = new PersonScope()
                    .findBy({ geburtsdatum: birthday })
                    .sortBy('vorname', ScopeOrder.ASC)
                    .paged(10, 10);
                const [persons, total]: Counted<PersonEntity> = await scope.executeQuery(em);

                expect(total).toBe(20);
                expect(persons).toHaveLength(10);
            });
        });

        describe('when filtering by suchFilter', () => {
            const suchFilter: string = 'Max';

            beforeEach(async () => {
                const person1: PersonEntity = mapper.map(
                    DoFactory.createPerson(false, { vorname: 'Max' }),
                    PersonDo,
                    PersonEntity,
                );
                const person2: PersonEntity = mapper.map(
                    DoFactory.createPerson(false, { vorname: 'John' }),
                    PersonDo,
                    PersonEntity,
                );
                await em.persistAndFlush([person1, person2]);
            });

            it('should return found persons and not return persons that do not match the suchFilter', async () => {
                const scope: PersonScope = new PersonScope()
                    .findBySearchString(suchFilter)
                    .sortBy('vorname', ScopeOrder.ASC);
                const [persons, total]: Counted<PersonEntity> = await scope.executeQuery(em);

                expect(total).toBe(1);
                expect(persons).toHaveLength(1);
                expect(persons[0]?.vorname).toBe(suchFilter);
                expect(persons[0]?.vorname).not.toBe('John');
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

        describe('when filtering for organisation ID', () => {
            const orgnisationID: string = faker.string.uuid();

            beforeEach(async () => {
                const person1: PersonEntity = createPersonEntity();
                const person2: PersonEntity = createPersonEntity();
                const rolle: Rolle<true> = await rolleRepo.save(DoFactory.createRolle(false));
                await em.persistAndFlush([person1, person2]);
                await createPersonenkontext(person1.id, orgnisationID, rolle.id);
            });

            it('should return found persons', async () => {
                const scope: PersonScope = new PersonScope()
                    .findBy({ organisationen: [orgnisationID] })
                    .sortBy('vorname', ScopeOrder.ASC);
                const [persons, total]: Counted<PersonEntity> = await scope.executeQuery(em);

                expect(total).toBe(1);
                expect(persons).toHaveLength(1);
            });
        });

        describe('when filtering for organisation ID & Rollen ID', () => {
            const orgnisationID: string = faker.string.uuid();
            let rolleID: string;

            beforeEach(async () => {
                const person1: PersonEntity = createPersonEntity();
                const person2: PersonEntity = createPersonEntity();
                const rolle: Rolle<true> = await rolleRepo.save(DoFactory.createRolle(false));
                rolleID = rolle.id;
                await em.persistAndFlush([person1, person2]);
                await createPersonenkontext(person1.id, orgnisationID, rolle.id);
            });

            it('should return found persons', async () => {
                const scope: PersonScope = new PersonScope()
                    .findByPersonenKontext([orgnisationID], [rolleID])
                    .sortBy('vorname', ScopeOrder.ASC);
                const [persons, total]: Counted<PersonEntity> = await scope.executeQuery(em);

                expect(total).toBe(1);
                expect(persons).toHaveLength(1);
            });
        });

        describe('when filtering for organisation ID only', () => {
            const organisationID: string = faker.string.uuid();

            beforeEach(async () => {
                const person1: PersonEntity = createPersonEntity();
                const rolle: Rolle<true> = await rolleRepo.save(DoFactory.createRolle(false));

                await em.persistAndFlush([person1]);
                await createPersonenkontext(person1.id, organisationID, rolle.id);
            });

            it('should return found persons', async () => {
                const scope: PersonScope = new PersonScope()
                    .findByPersonenKontext([organisationID])
                    .sortBy('vorname', ScopeOrder.ASC);
                const [persons, total]: Counted<PersonEntity> = await scope.executeQuery(em);

                expect(total).toBe(1);
                expect(persons).toHaveLength(1);
            });
        });

        describe('when filtering for Rolle ID only', () => {
            let rolleID: string;

            beforeEach(async () => {
                const person1: PersonEntity = createPersonEntity();
                const rolle: Rolle<true> = await rolleRepo.save(DoFactory.createRolle(false));
                rolleID = rolle.id;
                await em.persistAndFlush([person1]);
                await createPersonenkontext(person1.id, faker.string.uuid(), rolleID);
            });

            it('should return found persons', async () => {
                const scope: PersonScope = new PersonScope()
                    .findByPersonenKontext(undefined, [rolleID])
                    .sortBy('vorname', ScopeOrder.ASC);
                const [persons, total]: Counted<PersonEntity> = await scope.executeQuery(em);

                expect(total).toBe(1);
                expect(persons).toHaveLength(1);
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
