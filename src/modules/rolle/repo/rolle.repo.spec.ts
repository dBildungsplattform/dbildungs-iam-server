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
import { Rolle } from '../domain/rolle.js';
import { RolleMapperProfile } from '../mapper/rolle.mapper.profile.js';
import { RolleRepo } from './rolle.repo.js';

describe('RolleRepo', () => {
    let module: TestingModule;
    let sut: RolleRepo;
    let orm: MikroORM;
    let em: EntityManager;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true }), MapperTestModule],
            providers: [RolleRepo, RolleMapperProfile],
        }).compile();

        sut = module.get(RolleRepo);
        orm = module.get(MikroORM);
        em = module.get(EntityManager);

        await DatabaseTestModule.setupDatabase(orm);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await module.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
        expect(em).toBeDefined();
    });

    describe('save', () => {
        it('should save a new rolle', async () => {
            const rolle: Rolle = DoFactory.createRolle(false);

            const savedRolle: Rolle = await sut.save(rolle);

            expect(savedRolle.id).toBeDefined();
        });

        it('should update an existing rolle', async () => {
            const existingRolle: Rolle = await sut.save(DoFactory.createRolle(false));
            const update: Rolle = DoFactory.createRolle(false);
            update.id = existingRolle.id;

            const savedRolle: Rolle = await sut.save(existingRolle);

            expect(savedRolle).toEqual(existingRolle);
        });

        it('should update rolle with id', async () => {
            const rolle: Rolle = DoFactory.createRolle(true);

            const savedRolle: Rolle = await sut.save(rolle);

            expect(savedRolle).toEqual(rolle);
        });
    });

    describe('findById', () => {
        it('should return the rolle', async () => {
            const rolle: Rolle = await sut.save(DoFactory.createRolle(false));

            const rolleResult: Option<Rolle> = await sut.findById(rolle.id!);

            expect(rolleResult).toBeDefined();
            expect(rolleResult).toBeInstanceOf(Rolle);
            expect(rolleResult).toEqual(rolle);
        });

        it('should return undefined if the entity does not exist', async () => {
            const rolle: Option<Rolle> = await sut.findById(faker.string.uuid());

            expect(rolle).toBeNull();
        });
    });
});
