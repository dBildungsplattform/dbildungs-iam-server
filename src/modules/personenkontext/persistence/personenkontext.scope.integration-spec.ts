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
import { PersonenkontextDo } from '../domain/personenkontext.do.js';
import { PersonPersistenceMapperProfile } from '../../person/persistence/person-persistence.mapper.profile.js';
import { PersonenkontextEntity } from './personenkontext.entity.js';
import { PersonenkontextScope } from './personenkontext.scope.js';
import { PersonDo } from '../../person/domain/person.do.js';
import { PersonEntity } from '../../person/persistence/person.entity.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleFactory } from '../../rolle/domain/rolle.factory.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';

describe('PersonenkontextScope', () => {
    let module: TestingModule;
    let orm: MikroORM;
    let em: EntityManager;
    let mapper: Mapper;
    let rolleRepo: RolleRepo;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true }), MapperTestModule],
            providers: [PersonPersistenceMapperProfile, RolleFactory, RolleRepo, ServiceProviderRepo],
        }).compile();
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
    describe('findBy', () => {
        describe('when filtering for personenkontexte', () => {
            beforeEach(async () => {
                const person: PersonDo<true> = DoFactory.createPerson(true);
                const rolle: Rolle<true> = await rolleRepo.save(DoFactory.createRolle(false));

                await em.persistAndFlush(mapper.map(person, PersonDo, PersonEntity));

                const dos: PersonenkontextDo<false>[] = DoFactory.createMany<PersonenkontextDo<false>>(
                    30,
                    false,
                    DoFactory.createPersonenkontext,
                    { personId: person.id, rolleId: rolle.id },
                );

                await em.persistAndFlush(
                    // Don't use mapArray, because beforeMap does not get called
                    dos.map((pkDo: PersonenkontextDo<false>) =>
                        mapper.map(pkDo, PersonenkontextDo, PersonenkontextEntity),
                    ),
                );
            });

            it('should return found personenkontexte', async () => {
                const scope: PersonenkontextScope = new PersonenkontextScope()
                    .findBy({ referrer: 'referrer' })
                    .sortBy('id', ScopeOrder.ASC)
                    .paged(10, 10);
                const [personenkontext, total]: Counted<PersonenkontextEntity> = await scope.executeQuery(em);

                expect(total).toBe(30);
                expect(personenkontext).toHaveLength(10);
            });
        });
    });
});
