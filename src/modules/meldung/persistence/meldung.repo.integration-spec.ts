import { EntityManager, MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DatabaseTestModule,
    DoFactory,
    LoggingTestModule,
} from '../../../../test/utils/index.js';
import { MeldungRepo } from './meldung.repo.js';
import { Meldung } from '../domain/meldung.js';
import { faker } from '@faker-js/faker';

describe('MeldungRepo', () => {
    let module: TestingModule;
    let sut: MeldungRepo;

    let orm: MikroORM;
    let em: EntityManager;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true }), LoggingTestModule],
            providers: [MeldungRepo],
        }).compile();

        sut = module.get(MeldungRepo);
        orm = module.get(MikroORM);
        em = module.get(EntityManager);

        await DatabaseTestModule.setupDatabase(orm);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await orm.close();
        await module.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
        expect(em).toBeDefined();
    });

    describe('findById', () => {
        it('should return the meldung', async () => {
            const meldung: Meldung<true> = await sut.save(DoFactory.createMeldung(false));
            em.clear();

            const meldungResult: Option<Meldung<true>> = await sut.findById(meldung.id);

            expect(meldungResult).toBeDefined();
            expect(meldungResult).toBeInstanceOf(Meldung);
        });

        it('should return undefined if the entity does not exist', async () => {
            const serviceProvider: Option<Meldung<true>> = await sut.findById(faker.string.uuid());

            expect(serviceProvider).toBeNull();
        });
    });

    describe('findAll', () => {
        it('should return all meldungen', async () => {
            await sut.save(DoFactory.createMeldung(false));
            await sut.save(DoFactory.createMeldung(false));
            em.clear();

            const meldungenResult: Meldung<true>[] = await sut.findAll();

            expect(meldungenResult).toBeDefined();
            expect(meldungenResult.length).toEqual(2);
        });
    });

    describe('save', () => {
        it('should create the meldung if has not been persisted', async () => {
            await sut.save(DoFactory.createMeldung(false));
            em.clear();

            const meldungenResultAfter: Meldung<true>[] = await sut.findAll();
            expect(meldungenResultAfter).toBeDefined();
            expect(meldungenResultAfter.length).toEqual(1);
        });

        it('should update the meldung if has been persisted', async () => {
            const meldung: Meldung<true> = await sut.save(DoFactory.createMeldung(false));
            em.clear();

            meldung.inhalt = 'Mein Demo Inhalt 123';
            await sut.save(meldung);
            em.clear();

            const meldungenResultAfterUpdate: Meldung<true>[] = await sut.findAll();
            expect(meldungenResultAfterUpdate).toBeDefined();
            expect(meldungenResultAfterUpdate.length).toEqual(1);
            expect(meldungenResultAfterUpdate.at(0)?.inhalt).toEqual('Mein Demo Inhalt 123');
        });
    });
});
