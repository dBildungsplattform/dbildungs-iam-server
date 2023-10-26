import { Mapper } from '@automapper/core';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule, DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { OrganisationPersistenceMapperProfile } from './organisation-persistence.mapper.profile.js';
import { getMapperToken } from '@automapper/nestjs';
import { OrganisationScope } from './organisation.scope.js';
import { OrganisationEntity } from './organisation.entity.js';
import { OrganisationDo } from '../domain/organisation.do.js';
import { EntityManager } from '@mikro-orm/postgresql';

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
    }, 30 * 1_000);

    afterAll(async () => {
        await module.close();
    }, 30 * 1_000);

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
    });

    describe('findBy', () => {
        describe('when filtering for organizations', () => {
            beforeEach(async () => {
                const organisations: OrganisationEntity[] = Array.from({ length: 110 }, (_v: unknown, i: number) =>
                    mapper.map(
                        DoFactory.createOrganisation(false, { name: `Organization #${i}` }),
                        OrganisationDo,
                        OrganisationEntity,
                    ),
                );

                await em.persistAndFlush(organisations);
            });

            it('should return found Organizations', async () => {
                const scope: OrganisationScope = new OrganisationScope()
                    .findBy({ name: 'Organization #1 ' })
                    .paged(10, 10);
                const [organisations, total]: Counted<OrganisationEntity> = await scope.executeQuery(em);

                expect(total).toBe(0);
                expect(organisations).toHaveLength(0);
            });
        });
    });
});
