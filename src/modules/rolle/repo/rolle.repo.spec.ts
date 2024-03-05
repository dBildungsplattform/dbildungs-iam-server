import { faker } from '@faker-js/faker';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import {
    ConfigTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DatabaseTestModule,
    DoFactory,
} from '../../../../test/utils/index.js';
import { Rolle } from '../domain/rolle.js';
import { RolleRepo } from './rolle.repo.js';

describe('RolleRepo', () => {
    let module: TestingModule;
    let sut: RolleRepo;
    let orm: MikroORM;
    let em: EntityManager;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true })],
            providers: [RolleRepo],
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
            const rolle: Rolle<false> = DoFactory.createRolle(false);

            const savedRolle: Rolle<true> = await sut.save(rolle);

            expect(savedRolle.id).toBeDefined();
        });

        it('should update an existing rolle', async () => {
            const existingRolle: Rolle<true> = await sut.save(DoFactory.createRolle(false));
            const update: Rolle<false> = DoFactory.createRolle(false);
            update.id = existingRolle.id;

            const savedRolle: Rolle<true> = await sut.save(existingRolle);

            expect(savedRolle).toEqual(existingRolle);
        });
    });

    describe('find', () => {
        it('should return all rollen', async () => {
            const rollen: Rolle<true>[] = await Promise.all([
                sut.save(DoFactory.createRolle(false)),
                sut.save(DoFactory.createRolle(false)),
                sut.save(DoFactory.createRolle(false)),
            ]);

            const rollenResult: Rolle<true>[] = await sut.find();

            expect(rollenResult).toHaveLength(3);
            expect(rollenResult).toEqual(rollen);
        });
    });

    describe('findById', () => {
        it('should return the rolle', async () => {
            const rolle: Rolle<true> = await sut.save(DoFactory.createRolle(false));

            const rolleResult: Option<Rolle<true>> = await sut.findById(rolle.id);

            expect(rolleResult).toBeDefined();
            expect(rolleResult).toBeInstanceOf(Rolle);
        });

        it('should return undefined if the entity does not exist', async () => {
            const rolle: Option<Rolle<true>> = await sut.findById(faker.string.uuid());

            expect(rolle).toBeNull();
        });
    });

    describe('exists', () => {
        it('should return true, if the rolle exists', async () => {
            const rolle: Rolle<true> = await sut.save(DoFactory.createRolle(false));

            const exists: boolean = await sut.exists(rolle.id);

            expect(exists).toBe(true);
        });

        it('should return false, if the rolle does not exists', async () => {
            const exists: boolean = await sut.exists(faker.string.uuid());

            expect(exists).toBe(false);
        });
    });
});
