import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
} from '../../../../test/utils/index.js';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { OxUserBlacklistRepo } from './ox-user-blacklist.repo.js';
import { OxUserBlacklistEntry } from '../domain/ox-user-blacklist-entry.js';
import { OxUserBlacklistEntity } from './ox-user-blacklist.entity.js';
import { OXEmail, OXUserName } from '../../../shared/types/ox-ids.types.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { createMock } from '@golevelup/ts-jest';

describe('OxUserBlacklistRepo', () => {
    let module: TestingModule;
    let sut: OxUserBlacklistRepo;
    let orm: MikroORM;
    let em: EntityManager;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true })],
            providers: [
                OxUserBlacklistRepo,
                {
                    provide: ClassLogger,
                    useValue: createMock<ClassLogger>(),
                },
            ],
        }).compile();
        sut = module.get(OxUserBlacklistRepo);
        orm = module.get(MikroORM);
        em = module.get(EntityManager);

        await DatabaseTestModule.setupDatabase(orm);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    async function createEntity(email?: OXEmail, name?: string, username?: OXUserName): Promise<void> {
        const oxUserBlacklistEntity: OxUserBlacklistEntity = new OxUserBlacklistEntity();
        oxUserBlacklistEntity.email = email ?? faker.internet.email();
        oxUserBlacklistEntity.name = name ?? faker.person.lastName();
        oxUserBlacklistEntity.username = username ?? faker.internet.userName();
        await em.persistAndFlush(oxUserBlacklistEntity);
    }

    afterAll(async () => {
        await orm.close();
        await module.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('findByEmail', () => {
        describe('when entity can be found by email', () => {
            it('should return OxUserBlacklistEntry', async () => {
                const fakeEmail: OXEmail = faker.internet.email();
                await createEntity(fakeEmail);

                const findResult: Option<OxUserBlacklistEntry<true>> = await sut.findByEmail(fakeEmail);

                if (!findResult) throw Error();
                expect(findResult.email).toStrictEqual(fakeEmail);
            });
        });

        describe('when entity CANNOT be found by email', () => {
            it('should return null', async () => {
                const findResult: Option<OxUserBlacklistEntry<true>> = await sut.findByEmail(faker.internet.email());

                expect(findResult).toBeNull();
            });
        });
    });

    describe('findByUsername', () => {
        describe('when entity can be found by username', () => {
            it('should return OxUserBlacklistEntry', async () => {
                const fakeUsername: OXUserName = faker.internet.userName();
                await createEntity(undefined, undefined, fakeUsername);

                const findResult: Option<OxUserBlacklistEntry<true>> = await sut.findByUsername(fakeUsername);

                if (!findResult) throw Error();
                expect(findResult.username).toStrictEqual(fakeUsername);
            });
        });

        describe('when entity CANNOT be found by username', () => {
            it('should return null', async () => {
                const findResult: Option<OxUserBlacklistEntry<true>> = await sut.findByUsername(
                    faker.internet.userName(),
                );

                expect(findResult).toBeNull();
            });
        });
    });
});
