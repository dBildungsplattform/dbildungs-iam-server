import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { EntityManager, MikroORM, NotFoundError } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule, DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { PersonDo } from '../domain/person.do.js';
import { PersonenkontextDo } from '../domain/personenkontext.do.js';
import { PersonPersistenceMapperProfile } from './person-persistence.mapper.profile.js';
import { PersonEntity } from './person.entity.js';
import { PersonenkontextEntity } from './personenkontext.entity.js';
import { PersonenkontextRepo } from './personenkontext.repo.js';

describe('PersonenkontextRepo', () => {
    let module: TestingModule;
    let sut: PersonenkontextRepo;
    let orm: MikroORM;
    let em: EntityManager;
    let mapper: Mapper;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true }), MapperTestModule],
            providers: [PersonPersistenceMapperProfile, PersonenkontextRepo],
        }).compile();
        sut = module.get(PersonenkontextRepo);
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
        describe('When referenced person entity exists', () => {
            it('should create a personenkontext', async () => {
                const person: PersonDo<false> = DoFactory.createPerson(false);
                await em.persistAndFlush(mapper.map(person, PersonDo<false>, PersonEntity));
                const personId: string = (
                    await em.findOneOrFail(PersonEntity, {
                        firstName: person.firstName,
                    })
                ).id;

                const personenkontext: PersonenkontextDo<false> = DoFactory.createPersonenkontext(false, {
                    personId: personId,
                });
                await sut.save(personenkontext);
                await expect(em.find(PersonenkontextEntity, {})).resolves.toHaveLength(1);
            });

            it('should create a personenkontext', async () => {
                const person: PersonDo<false> = DoFactory.createPerson(false);
                await em.persistAndFlush(mapper.map(person, PersonDo<false>, PersonEntity));
                const personId: string = (
                    await em.findOneOrFail(PersonEntity, {
                        firstName: person.firstName,
                    })
                ).id;

                const newPersonenkontext: PersonenkontextDo<false> = DoFactory.createPersonenkontext(false, {
                    personId: personId,
                });
                const savedPersonenkontext: PersonenkontextDo<true> = await sut.save(newPersonenkontext);
                await expect(em.find(PersonenkontextEntity, { id: savedPersonenkontext.id })).resolves.toHaveLength(1);
            });

            it('should update a personenkontext and should not create a new personenkontext', async () => {
                const person: PersonDo<true> = DoFactory.createPerson(true);
                await em.persistAndFlush(mapper.map(person, PersonDo<true>, PersonEntity));
                const personId: string = (
                    await em.findOneOrFail(PersonEntity, {
                        firstName: person.firstName,
                    })
                ).id;

                const newPersonenkontext: PersonenkontextDo<true> = DoFactory.createPersonenkontext(true, {
                    personId: personId,
                });
                const savedPersonenkontext: PersonenkontextDo<true> = await sut.save(newPersonenkontext);
                await expect(em.find(PersonenkontextEntity, {})).resolves.toHaveLength(1);
                await sut.save(savedPersonenkontext);
                await expect(em.find(PersonenkontextEntity, {})).resolves.toHaveLength(1);
            });
        });
        describe('When referenced person does not exist', () => {
            it('should throw NotFoundError', async () => {
                const personenkontext: PersonenkontextDo<false> = DoFactory.createPersonenkontext(false);
                await expect(sut.save(personenkontext)).rejects.toThrow(NotFoundError);
            });
        });
    });
});
