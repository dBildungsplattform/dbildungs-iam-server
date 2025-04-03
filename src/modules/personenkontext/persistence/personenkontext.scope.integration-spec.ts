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
    LoggingTestModule,
    MapperTestModule,
} from '../../../../test/utils/index.js';
import { ScopeOrder } from '../../../shared/persistence/scope.enums.js';
import { PersonenkontextDo } from '../domain/personenkontext.do.js';
import { PersonPersistenceMapperProfile } from '../../person/persistence/person-persistence.mapper.profile.js';
import { PersonenkontextEntity } from './personenkontext.entity.js';
import { PersonenkontextScope } from './personenkontext.scope.js';
import { PersonEntity } from '../../person/persistence/person.entity.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleFactory } from '../../rolle/domain/rolle.factory.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { EventModule } from '../../../core/eventbus/event.module.js';
import { mapAggregateToData } from '../../person/persistence/person.repository.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';

describe('PersonenkontextScope', () => {
    let module: TestingModule;
    let orm: MikroORM;
    let em: EntityManager;
    let mapper: Mapper;
    let rolleRepo: RolleRepo;
    let organisationRepo: OrganisationRepository;

    const createPersonEntity = (): PersonEntity => {
        const person: PersonEntity = em.create(PersonEntity, mapAggregateToData(DoFactory.createPerson(false)));
        return person;
    };

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                LoggingTestModule,
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                MapperTestModule,
                EventModule,
                LoggingTestModule,
            ],
            providers: [
                PersonPersistenceMapperProfile,
                RolleFactory,
                RolleRepo,
                ServiceProviderRepo,
                OrganisationRepository,
            ],
        }).compile();
        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        mapper = module.get(getMapperToken());
        rolleRepo = module.get(RolleRepo);
        organisationRepo = module.get(OrganisationRepository);

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
                const person: PersonEntity = createPersonEntity();
                const organisation1: Organisation<true> = await organisationRepo.save(
                    DoFactory.createOrganisation(false),
                );

                await em.persistAndFlush(person);

                const dos: PersonenkontextDo<false>[] = DoFactory.createMany<PersonenkontextDo<false>>(
                    30,
                    false,
                    DoFactory.createPersonenkontextDo,
                    { personId: person.id, organisationId: organisation1.id },
                );
                /* eslint-disable no-await-in-loop */
                for (const doObj of dos) {
                    const rolle: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
                    if (rolle instanceof DomainError) throw Error();

                    doObj.rolleId = rolle.id;
                }
                /* eslint-disable no-await-in-loop */

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

    describe('byOrganisations', () => {
        describe('when filtering for personenkontexte', () => {
            let orgaId: string;

            beforeEach(async () => {
                const person: PersonEntity = createPersonEntity();
                await em.persistAndFlush(person);
                const organisation1: Organisation<true> = await organisationRepo.save(
                    DoFactory.createOrganisation(false),
                );
                orgaId = organisation1.id;

                const dos: PersonenkontextDo<false>[] = DoFactory.createMany<PersonenkontextDo<false>>(
                    30,
                    false,
                    DoFactory.createPersonenkontextDo,
                    { personId: person.id, organisationId: orgaId },
                );
                for (const doObj of dos) {
                    const rolle: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
                    if (rolle instanceof DomainError) throw Error();

                    doObj.rolleId = rolle.id;
                }

                await em.persistAndFlush(
                    // Don't use mapArray, because beforeMap does not get called
                    dos.map((pkDo: PersonenkontextDo<false>) =>
                        mapper.map(pkDo, PersonenkontextDo, PersonenkontextEntity),
                    ),
                );
            });

            it('should return found personenkontexte', async () => {
                const scope: PersonenkontextScope = new PersonenkontextScope()
                    .byOrganisations([orgaId])
                    .sortBy('id', ScopeOrder.ASC)
                    .paged(10, 10);
                const [personenkontext, total]: Counted<PersonenkontextEntity> = await scope.executeQuery(em);

                expect(total).toBe(30);
                expect(personenkontext).toHaveLength(10);
            });
        });
    });

    describe('findByRollen', () => {
        describe('when filtering for personenkontexte by rollenArt', () => {
            beforeEach(async () => {
                const rolleArten: RollenArt[] = [RollenArt.LEIT, RollenArt.LEHR, RollenArt.LERN];

                const organisation1: Organisation<true> = await organisationRepo.save(
                    DoFactory.createOrganisation(false),
                );

                for (const rolleArt of rolleArten) {
                    const person: PersonEntity = createPersonEntity();
                    await em.persistAndFlush(person);

                    const dos: PersonenkontextDo<false>[] = DoFactory.createMany<PersonenkontextDo<false>>(
                        10,
                        false,
                        DoFactory.createPersonenkontextDo,
                        { personId: person.id, organisationId: organisation1.id },
                    );
                    for (const doObj of dos) {
                        const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                            DoFactory.createRolle(false, { rollenart: rolleArt }),
                        );
                        if (rolle instanceof DomainError) throw Error();
                        doObj.rolleId = rolle.id;
                    }

                    await em.persistAndFlush(
                        // Don't use mapArray, because beforeMap does not get called
                        // eslint-disable-next-line @typescript-eslint/no-loop-func
                        dos.map((pkDo: PersonenkontextDo<false>) =>
                            mapper.map(pkDo, PersonenkontextDo, PersonenkontextEntity),
                        ),
                    );
                }
            });

            it('should return personenkontexte filtered by single rollenArt', async () => {
                const scope: PersonenkontextScope = new PersonenkontextScope().findByRollen([RollenArt.LEIT]);
                const [personenkontext, total]: Counted<PersonenkontextEntity> = await scope.executeQuery(em);

                expect(total).toBe(10);
                expect(personenkontext).toHaveLength(10);
                expect(
                    personenkontext.every(
                        (pk: PersonenkontextEntity) => pk.rolleId.getEntity().rollenart === RollenArt.LEIT,
                    ),
                ).toBe(true);
            });

            it('should return personenkontexte filtered by multiple rollenArt', async () => {
                const scope: PersonenkontextScope = new PersonenkontextScope().findByRollen([
                    RollenArt.LEHR,
                    RollenArt.LEIT,
                ]);
                const [personenkontext, total]: Counted<PersonenkontextEntity> = await scope.executeQuery(em);

                expect(total).toBe(20);
                expect(personenkontext).toHaveLength(20);
            });

            it('should return no personenkontexte for non-existent rollenArt', async () => {
                const scope: PersonenkontextScope = new PersonenkontextScope().findByRollen([RollenArt.EXTERN]);
                const [personenkontext, total]: Counted<PersonenkontextEntity> = await scope.executeQuery(em);

                expect(total).toBe(0);
                expect(personenkontext).toHaveLength(0);
            });
        });
    });
});
