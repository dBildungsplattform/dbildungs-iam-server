import { Test, TestingModule } from '@nestjs/testing';
import { OrganisationRepo } from './organisation.repo.js';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { ConfigTestModule, DatabaseTestModule, DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { OrganisationPersistenceMapperProfile } from './organisation-persistence.mapper.profile.js';
import { OrganisationDo } from '../domain/organisation.do.js';
import { OrganisationEntity } from './organisation.entity.js';
import { faker } from '@faker-js/faker';
import { OrganisationScope } from './organisation.scope.js';
import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';

describe('OgranisationRepo', () => {
    let module: TestingModule;
    let sut: OrganisationRepo;
    let orm: MikroORM;
    let em: EntityManager;
    let mapper: Mapper;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true }), MapperTestModule],
            providers: [OrganisationPersistenceMapperProfile, OrganisationRepo],
        }).compile();
        sut = module.get(OrganisationRepo);
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
        it('should create an organisation', async () => {
            const organisation: OrganisationDo<false> = DoFactory.createOrganisation(false);
            await sut.save(organisation);
            await expect(em.find(OrganisationEntity, {})).resolves.toHaveLength(1);
        });

        it('should create an organisation', async () => {
            const newOrganisation: OrganisationDo<false> = DoFactory.createOrganisation(false);
            const savedOrganisation: OrganisationDo<true> = await sut.save(newOrganisation);
            await expect(em.find(OrganisationEntity, { id: savedOrganisation.id })).resolves.toHaveLength(1);
        });

        it('should update an organisation and should not create a new organisation', async () => {
            const newOrganisation: OrganisationDo<true> = DoFactory.createOrganisation(true);
            const savedOrganisation: OrganisationDo<true> = await sut.save(newOrganisation);
            await expect(em.find(OrganisationEntity, {})).resolves.toHaveLength(1);
            await sut.save(savedOrganisation);
            await expect(em.find(OrganisationEntity, {})).resolves.toHaveLength(1);
        });
    });

    describe('findById', () => {
        it('should find an organization by ID', async () => {
            const organisationDo: OrganisationDo<false> = DoFactory.createOrganisation(false);
            const organisation: OrganisationDo<boolean> = await sut.save(organisationDo);
            const foundOrganisation: Option<OrganisationDo<true>> = await sut.findById(organisation.id as string);
            expect(foundOrganisation).toBeInstanceOf(OrganisationDo);
        });

        it('should return null', async () => {
            const foundOrganisation: Option<OrganisationDo<true>> = await sut.findById(faker.string.uuid());
            expect(foundOrganisation).toBeNull();
        });
    });

    describe('findBy', () => {
        it('should find an organization by scope', async () => {
            const props: Partial<OrganisationDo<true>> = {
                kennung: faker.lorem.word(),
                name: faker.lorem.word(),
            };
            const firstOrganisationDo: OrganisationDo<false> = DoFactory.createOrganisation(false, props);
            const secondOrganisationDo: OrganisationDo<false> = DoFactory.createOrganisation(false, props);

            await em.persistAndFlush(mapper.map(firstOrganisationDo, OrganisationDo, OrganisationEntity));
            await em.persistAndFlush(mapper.map(secondOrganisationDo, OrganisationDo, OrganisationEntity));

            const [result]: Counted<OrganisationDo<true>> = await sut.findBy(
                new OrganisationScope().findBy({
                    kennung: firstOrganisationDo.kennung,
                    name: firstOrganisationDo.name,
                }),
            );

            expect(result).toBeInstanceOf(Array);
            expect(result).toHaveLength(2);
            await expect(em.find(OrganisationEntity, {})).resolves.toHaveLength(2);
        });

        it('should return an empty array', async () => {
            const [result]: Counted<OrganisationDo<true>> = await sut.findBy(new OrganisationScope());

            expect(result).toBeInstanceOf(Array);
            expect(result).not.toBeNull();
            expect(result).toHaveLength(0);
            await expect(em.find(OrganisationEntity, {})).resolves.toHaveLength(0);
        });
    });
});
