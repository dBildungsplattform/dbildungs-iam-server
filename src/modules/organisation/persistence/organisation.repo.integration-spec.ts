import { Test, TestingModule } from '@nestjs/testing';
import { OrganisationRepo } from './organisation.repo.js';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { ConfigTestModule, DatabaseTestModule, DoFactory, MapperTestModule } from '../../../../test/utils/index.js';
import { OrganisationPersistenceMapperProfile } from './organisation-persistence.mapper.profile.js';
import { OrganisationDo } from '../domain/organisation.do.js';
import { OrganisationEntity } from './organisation.entity.js';
import { faker } from '@faker-js/faker';

describe('OgranisationRepo', () => {
    let module: TestingModule;
    let sut: OrganisationRepo;
    let orm: MikroORM;
    let em: EntityManager;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true }), MapperTestModule],
            providers: [OrganisationPersistenceMapperProfile, OrganisationRepo],
        }).compile();
        sut = module.get(OrganisationRepo);
        orm = module.get(MikroORM);
        em = module.get(EntityManager);
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
            await sut.save(organisationDo);
            const [organisation]: OrganisationEntity[] = await em.find(OrganisationEntity, {});
            expect(organisation).toBeInstanceOf(OrganisationEntity);
            const foundOrganisation: Option<OrganisationDo<true>> = await sut.findById(
                (organisation as OrganisationEntity).id,
            );
            expect(foundOrganisation).toBeInstanceOf(OrganisationDo);
        });

        it('should return null', async () => {
            const foundOrganisation: Option<OrganisationDo<true>> = await sut.findById(faker.string.uuid());
            expect(foundOrganisation).toBeNull();
        });
    });
});
