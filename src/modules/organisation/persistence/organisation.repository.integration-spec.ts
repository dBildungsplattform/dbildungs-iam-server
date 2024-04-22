import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { faker } from '@faker-js/faker';
import { EntityManager, MikroORM, RequiredEntityData } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DoFactory,
    MapperTestModule,
} from '../../../../test/utils/index.js';
import { OrganisationRepository, mapAggregateToData, mapEntityToAggregate } from './organisation.repository.js';
import { OrganisationPersistenceMapperProfile } from './organisation-persistence.mapper.profile.js';
import { OrganisationEntity } from './organisation.entity.js';
import { OrganisationDo } from '../domain/organisation.do.js';
import { Organisation } from '../domain/organisation.js';
import { OrganisationScope } from './organisation.scope.js';
import { OrganisationsTyp } from '../domain/organisation.enums.js';
import { ScopeOperator } from '../../../shared/persistence/index.js';

describe('PersonRepository', () => {
    let module: TestingModule;
    let sut: OrganisationRepository;
    let orm: MikroORM;
    let em: EntityManager;
    let mapper: Mapper;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true }), MapperTestModule],
            providers: [OrganisationPersistenceMapperProfile, OrganisationRepository],
        }).compile();
        sut = module.get(OrganisationRepository);
        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        mapper = module.get(getMapperToken());

        await DatabaseTestModule.setupDatabase(orm);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await module.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('mapAggregateToData', () => {
        it('should return Person RequiredEntityData', () => {
            const organisation: Organisation<true> = Organisation.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                faker.string.uuid(),
                faker.string.uuid(),
                faker.lorem.word(),
                faker.lorem.word(),
                faker.lorem.word(),
                faker.string.uuid(),
                undefined,
                undefined,
            );

            const expectedProperties: string[] = [
                'administriertVon',
                'zugehoerigZu',
                'kennung',
                'name',
                'namensergaenzung',
                'kuerzel',
                'typ',
                'traegerschaft',
            ];

            const result: RequiredEntityData<OrganisationEntity> = mapAggregateToData(organisation);

            expectedProperties.forEach((prop: string) => {
                expect(result).toHaveProperty(prop);
            });
        });
    });

    describe('mapEntityToAggregate', () => {
        it('should return New Aggregate', () => {
            const organisationEntity: OrganisationEntity = mapper.map(
                DoFactory.createOrganisation(true),
                OrganisationDo,
                OrganisationEntity,
            );
            const organisation: Organisation<true> = mapEntityToAggregate(organisationEntity);

            expect(organisation).toBeInstanceOf(Organisation);
        });
    });

    describe('findBy', () => {
        let organisation1: Organisation<false>;
        let organisation2: Organisation<false>;
        let organisation3: Organisation<false>;
        let organisationEntity1: OrganisationEntity;
        let organisationEntity2: OrganisationEntity;
        let organisationEntity3: OrganisationEntity;

        beforeEach(async () => {
            organisation1 = Organisation.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                faker.string.uuid(),
                faker.string.uuid(),
                '05674',
                'Name1',
                faker.lorem.word(),
                faker.string.uuid(),
                OrganisationsTyp.SCHULE,
                undefined,
            );
            organisation2 = Organisation.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                faker.string.uuid(),
                faker.string.uuid(),
                '44123',
                'Name2',
                faker.lorem.word(),
                faker.string.uuid(),
                OrganisationsTyp.ROOT,
                undefined,
            );
            organisation3 = Organisation.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                faker.string.uuid(),
                faker.string.uuid(),
                '75693',
                'TestSchule',
                faker.lorem.word(),
                faker.string.uuid(),
                OrganisationsTyp.SCHULE,
                undefined,
            );
            organisationEntity1 = em.create(OrganisationEntity, mapAggregateToData(organisation1));
            organisationEntity2 = em.create(OrganisationEntity, mapAggregateToData(organisation2));
            organisationEntity3 = em.create(OrganisationEntity, mapAggregateToData(organisation3));
            await em.persistAndFlush([organisationEntity1, organisationEntity2, organisationEntity3]);
        });

        afterEach(async () => {
            await em.removeAndFlush([organisationEntity1, organisationEntity2]);
        });
        describe('When Called Only With searchString', () => {
            it('should return Correct Aggregates By SearchString', async () => {
                const [result]: Counted<OrganisationDo<true>> = await sut.findBy(
                    new OrganisationScope().searchString(organisation1.kennung),
                );

                expect(result).toBeInstanceOf(Array);
                expect(result).toHaveLength(1);
                expect(result.at(0)?.kennung).toEqual(organisation1.kennung);
            });

            it('should return Correct Aggregates By SearchString', async () => {
                const [result]: Counted<OrganisationDo<true>> = await sut.findBy(
                    new OrganisationScope().searchString('Name2'),
                );

                expect(result).toBeInstanceOf(Array);
                expect(result).toHaveLength(1);
                expect(result.at(0)?.kennung).toEqual(organisation2.kennung);
            });

            it('should return Correct Aggregates By SearchString', async () => {
                const [result]: Counted<OrganisationDo<true>> = await sut.findBy(
                    new OrganisationScope().searchString('Name'),
                );

                expect(result).toBeInstanceOf(Array);
                expect(result).toHaveLength(2);
            });
        });
        describe('When Called Only With filters', () => {
            it('should return Correct Aggregates By Filters', async () => {
                const [result]: Counted<OrganisationDo<true>> = await sut.findBy(
                    new OrganisationScope().findBy({
                        kennung: organisation1.kennung as string,
                    }),
                );

                expect(result).toBeInstanceOf(Array);
                expect(result).toHaveLength(1);
                expect(result.at(0)?.kennung).toEqual(organisation1.kennung);
            });

            it('should return Correct Aggregates By Filters', async () => {
                const [result]: Counted<OrganisationDo<true>> = await sut.findBy(
                    new OrganisationScope().findBy({
                        typ: OrganisationsTyp.SCHULE as string,
                    }),
                );

                expect(result).toBeInstanceOf(Array);
                expect(result).toHaveLength(2);
            });
        });
        describe('When Called With searchString & filters and scopeWhere Operator AND', () => {
            it('should return Correct Aggregates By Filters AND searchString', async () => {
                const [result]: Counted<OrganisationDo<true>> = await sut.findBy(
                    new OrganisationScope()
                        .findBy({
                            typ: OrganisationsTyp.SCHULE as string,
                        })
                        .setScopeWhereOperator(ScopeOperator.AND)
                        .searchString('Test'),
                );

                expect(result).toBeInstanceOf(Array);
                expect(result).toHaveLength(1);
                expect(result.at(0)?.kennung).toEqual(organisation3.kennung);
            });
        });

        describe('When Called With searchString & filters and scopeWhere Operator OR', () => {
            it('should return Correct Aggregates By Filters OR searchString', async () => {
                const [result]: Counted<OrganisationDo<true>> = await sut.findBy(
                    new OrganisationScope()
                        .findBy({
                            typ: OrganisationsTyp.SCHULE as string,
                        })
                        .setScopeWhereOperator(ScopeOperator.OR)
                        .searchString('Test'),
                );

                expect(result).toBeInstanceOf(Array);
                expect(result).toHaveLength(2);
            });
        });
    });
});
