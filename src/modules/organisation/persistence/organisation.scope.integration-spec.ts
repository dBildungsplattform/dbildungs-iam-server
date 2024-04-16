import { Mapper } from '@automapper/core';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DatabaseTestModule,
    DoFactory,
    MapperTestModule,
} from '../../../../test/utils/index.js';
import { OrganisationPersistenceMapperProfile } from './organisation-persistence.mapper.profile.js';
import { getMapperToken } from '@automapper/nestjs';
import { OrganisationScope } from './organisation.scope.js';
import { OrganisationEntity } from './organisation.entity.js';
import { OrganisationDo } from '../domain/organisation.do.js';
import { EntityManager } from '@mikro-orm/postgresql';
import { ScopeOrder } from '../../../shared/persistence/scope.enums.js';

describe('OrganisationScope', () => {
    let module: TestingModule;
    let orm: MikroORM;
    let em: EntityManager;
    let mapper: Mapper;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true }), MapperTestModule],
            providers: [OrganisationPersistenceMapperProfile],
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
        describe('when filtering for organizations', () => {
            beforeEach(async () => {
                const organisations: OrganisationEntity[] = Array.from({ length: 100 }, (_v: unknown, i: number) =>
                    mapper.map(
                        DoFactory.createOrganisation(false, { name: `Organization #${i}` }),
                        OrganisationDo,
                        OrganisationEntity,
                    ),
                );

                await em.persistAndFlush(organisations);
            });

            it('should return found organizations', async () => {
                const scope: OrganisationScope = new OrganisationScope()
                    .findBy({ name: new RegExp('Organization #1') })
                    .sortBy('name', ScopeOrder.ASC)
                    .paged(5, 10);

                const [organisations, total]: Counted<OrganisationEntity> = await scope.executeQuery(em);

                expect(total).toBe(11);
                expect(organisations).toHaveLength(6);
            });
        });
    });
});
