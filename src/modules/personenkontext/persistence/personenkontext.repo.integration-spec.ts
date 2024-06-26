import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { faker } from '@faker-js/faker';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DatabaseTestModule,
    DoFactory,
    MapperTestModule,
} from '../../../../test/utils/index.js';
import { PersonDo } from '../../person/domain/person.do.js';
import { PersonenkontextDo } from '../domain/personenkontext.do.js';
import { Personenstatus, Rolle, SichtfreigabeType } from '../domain/personenkontext.enums.js';
import { PersonPersistenceMapperProfile } from '../../person/persistence/person-persistence.mapper.profile.js';
import { PersonEntity } from '../../person/persistence/person.entity.js';
import { PersonenkontextEntity } from './personenkontext.entity.js';
import { PersonenkontextRepo } from './personenkontext.repo.js';
import { PersonenkontextScope } from './personenkontext.scope.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Rolle as RolleAggregate } from '../../rolle/domain/rolle.js';
import { RolleFactory } from '../../rolle/domain/rolle.factory.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { EventModule } from '../../../core/eventbus/event.module.js';

describe('PersonenkontextRepo', () => {
    let module: TestingModule;
    let sut: PersonenkontextRepo;
    let orm: MikroORM;
    let em: EntityManager;
    let mapper: Mapper;
    let rolleRepo: RolleRepo;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                MapperTestModule,
                EventModule,
            ],
            providers: [
                PersonPersistenceMapperProfile,
                PersonenkontextRepo,
                RolleRepo,
                RolleFactory,
                ServiceProviderRepo,
                OrganisationRepository,
            ],
        }).compile();
        sut = module.get(PersonenkontextRepo);
        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        mapper = module.get(getMapperToken());
        rolleRepo = module.get(RolleRepo);

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

    describe('save', () => {
        describe('When referenced person entity exists', () => {
            it('should create a personenkontext', async () => {
                const newPerson: PersonDo<false> = DoFactory.createPerson(false);
                const rolle: RolleAggregate<true> = await rolleRepo.save(DoFactory.createRolle(false));

                await em.persistAndFlush(mapper.map(newPerson, PersonDo<false>, PersonEntity));

                const personEntity: PersonEntity = await em.findOneOrFail(PersonEntity, {
                    vorname: newPerson.vorname,
                });
                const newPersonenkontext: PersonenkontextDo<false> = DoFactory.createPersonenkontext(false, {
                    personId: personEntity.id,
                    rolleId: rolle.id,
                });

                const savedPersonenkontext: Option<PersonenkontextDo<true>> = await sut.save(newPersonenkontext);

                await expect(
                    em.find(PersonenkontextEntity, { id: savedPersonenkontext ? savedPersonenkontext.id : null }),
                ).resolves.toHaveLength(1);
            });

            it('should update a personenkontext and should not create a new personenkontext', async () => {
                const newPerson: PersonDo<false> = DoFactory.createPerson(false);
                const rolle: RolleAggregate<true> = await rolleRepo.save(DoFactory.createRolle(false));

                await em.persistAndFlush(mapper.map(newPerson, PersonDo<false>, PersonEntity));

                const personEntity: PersonEntity = await em.findOneOrFail(PersonEntity, {
                    vorname: newPerson.vorname,
                });
                const newPersonenkontext: PersonenkontextDo<false> = DoFactory.createPersonenkontext(false, {
                    personId: personEntity.id,
                    rolleId: rolle.id,
                });

                const savedPersonenkontext: Option<PersonenkontextDo<true>> = await sut.save(newPersonenkontext);
                if (!savedPersonenkontext) {
                    fail('Could not save personenkontext');
                }
                await expect(em.find(PersonenkontextEntity, {})).resolves.toHaveLength(1);
                await sut.save(savedPersonenkontext);
                await expect(em.find(PersonenkontextEntity, {})).resolves.toHaveLength(1);
            });

            it('should update a personenkontext with id and should not create a new personenkontext', async () => {
                const newPerson: PersonDo<false> = DoFactory.createPerson(false);
                const rolle: RolleAggregate<true> = await rolleRepo.save(DoFactory.createRolle(false));

                await em.persistAndFlush(mapper.map(newPerson, PersonDo<false>, PersonEntity));

                const personEntity: PersonEntity = await em.findOneOrFail(PersonEntity, {
                    vorname: newPerson.vorname,
                });
                const newPersonenkontext: PersonenkontextDo<true> = DoFactory.createPersonenkontext(true, {
                    personId: personEntity.id,
                    rolleId: rolle.id,
                });

                const savedPersonenkontext: Option<PersonenkontextDo<true>> = await sut.save(newPersonenkontext);
                if (!savedPersonenkontext) {
                    fail('Could not save personenkontext');
                }
                await expect(em.find(PersonenkontextEntity, {})).resolves.toHaveLength(1);
                await sut.save(savedPersonenkontext);
                await expect(em.find(PersonenkontextEntity, {})).resolves.toHaveLength(1);
            });
        });
    });

    describe('findBy', () => {
        describe('When personenkontext for person exists', () => {
            it('should find all personenkontexte for this person', async () => {
                const props: Partial<PersonenkontextDo<false>> = {
                    referrer: 'referrer',
                    personenstatus: Personenstatus.AKTIV,
                    rolle: Rolle.LERNENDER,
                    sichtfreigabe: SichtfreigabeType.NEIN,
                };
                const person1: PersonDo<true> = DoFactory.createPerson(true);
                const person2: PersonDo<true> = DoFactory.createPerson(true);
                const rolle: RolleAggregate<true> = await rolleRepo.save(DoFactory.createRolle(false));

                await em.persistAndFlush([
                    mapper.map(person1, PersonDo, PersonEntity),
                    mapper.map(person2, PersonDo, PersonEntity),
                ]);
                const personenkontextDo1: PersonenkontextDo<false> = DoFactory.createPersonenkontext(false, {
                    ...props,
                    personId: person1.id,
                    rolleId: rolle.id,
                });
                const personenkontextDo2: PersonenkontextDo<false> = DoFactory.createPersonenkontext(false, {
                    ...props,
                    personId: person2.id,
                    rolleId: rolle.id,
                });
                await em.persistAndFlush(mapper.map(personenkontextDo1, PersonenkontextDo, PersonenkontextEntity));
                await em.persistAndFlush(mapper.map(personenkontextDo2, PersonenkontextDo, PersonenkontextEntity));

                const [result]: Counted<PersonenkontextDo<true>> = await sut.findBy(
                    new PersonenkontextScope().findBy({
                        referrer: 'referrer',
                        personenstatus: Personenstatus.AKTIV,
                        rolle: Rolle.LERNENDER,
                        sichtfreigabe: SichtfreigabeType.NEIN,
                        personId: person1.id,
                    }),
                );
                expect(result).not.toBeNull();
                expect(result).toHaveLength(1);
                await expect(em.find(PersonenkontextEntity, {})).resolves.toHaveLength(2);
            });
        });

        describe('When no personenkontext matches', () => {
            it('should return an empty list', async () => {
                const [result]: Counted<PersonenkontextDo<true>> = await sut.findBy(new PersonenkontextScope());

                expect(result).not.toBeNull();
                expect(result).toHaveLength(0);
                await expect(em.find(PersonenkontextEntity, {})).resolves.toHaveLength(0);
            });
        });
    });

    describe('findById', () => {
        beforeEach(async () => {
            const person: PersonDo<true> = DoFactory.createPerson(true);
            const rolle: RolleAggregate<true> = await rolleRepo.save(DoFactory.createRolle(false));

            await em.persistAndFlush(mapper.map(person, PersonDo, PersonEntity));

            const personenkontextDos: PersonenkontextDo<false>[] = DoFactory.createMany<PersonenkontextDo<false>>(
                10,
                false,
                DoFactory.createPersonenkontext,
                { personId: person.id, rolleId: rolle.id },
            );

            await em.persistAndFlush(
                personenkontextDos.map((entity: PersonenkontextDo<false>) =>
                    mapper.map(entity, PersonenkontextDo, PersonenkontextEntity),
                ),
            );
        });

        describe('when finding personenkontext by id', () => {
            it('should return personenkontext', async () => {
                const [personenkontextEntity]: PersonenkontextEntity[] = await em.find<PersonenkontextEntity>(
                    PersonenkontextEntity,
                    {},
                );

                expect(personenkontextEntity?.id).toBeDefined();

                const result: Option<PersonenkontextDo<true>> = await sut.findById(personenkontextEntity?.id as string);

                expect(result).toBeInstanceOf(PersonenkontextDo);
            });
        });

        describe('when NOT finding a personenkontext', () => {
            it('should return null', async () => {
                const result: Option<PersonenkontextDo<true>> = await sut.findById(faker.string.uuid());

                expect(result).toBeNull();
            });
        });
    });

    describe('deleteById', () => {
        describe('when deleting personenkontext by id', () => {
            it('should return number of deleted rows', async () => {
                const person: PersonDo<true> = DoFactory.createPerson(true);
                const rolle: RolleAggregate<true> = await rolleRepo.save(DoFactory.createRolle(false));

                await em.persistAndFlush(mapper.map(person, PersonDo, PersonEntity));

                const personenkontextDos: PersonenkontextDo<false>[] = DoFactory.createMany<PersonenkontextDo<false>>(
                    5,
                    false,
                    DoFactory.createPersonenkontext,
                    { personId: person.id, rolleId: rolle.id },
                );

                await em.persistAndFlush(
                    personenkontextDos.map((entity: PersonenkontextDo<false>) =>
                        mapper.map(entity, PersonenkontextDo, PersonenkontextEntity),
                    ),
                );

                const [personenkontextEntity]: PersonenkontextEntity[] = await em.find<PersonenkontextEntity>(
                    PersonenkontextEntity,
                    {},
                );

                const result: number = await sut.deleteById(personenkontextEntity?.id as string);

                expect(result).toBe(1);
            });
        });

        describe('when no personenkontext was deleted', () => {
            it('should return 0', async () => {
                const result: number = await sut.deleteById(faker.string.uuid());

                expect(result).toBe(0);
            });
        });
    });
});
