import { MikroORM, UmzugMigration } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DatabaseTestModule,
    LoggingTestModule,
} from '../../../test/utils/index.js';
import fs from 'fs';
import { DbInitMigrationConsole } from './db-init-migration.console.js';
import { DbApplyMigrationConsole, MigrationType } from './db-apply-migration.console.js';
import { DbCreateMigrationConsole } from './db-create-migration.console.js';
import { Migrator } from '@mikro-orm/migrations';
import { ClassLogger } from '../../core/logging/class-logger.js';

describe('DbMigrateConsole', () => {
    let module: TestingModule;
    let dbMigrationInit: DbInitMigrationConsole;
    let dbMigrationCreate: DbCreateMigrationConsole;
    let dbMigrationApply: DbApplyMigrationConsole;
    let orm: MikroORM;
    let migrator: jest.Mocked<Migrator>;
    let logger: jest.Mocked<ClassLogger>;

    beforeAll(async () => {
        migrator = {
            getPendingMigrations: jest.fn(),
            up: jest.fn(),
        } as unknown as jest.Mocked<Migrator>;

        const ormMock: Partial<MikroORM> = {
            getMigrator: jest.fn().mockReturnValue(migrator),
        };

        logger = {
            info: jest.fn(),
        } as unknown as jest.Mocked<ClassLogger>;

        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true }), LoggingTestModule],
            providers: [
                DbInitMigrationConsole,
                DbCreateMigrationConsole,
                DbApplyMigrationConsole,
                {
                    provide: MikroORM,
                    useValue: ormMock,
                },
                {
                    provide: ClassLogger,
                    useValue: logger,
                },
            ],
        }).compile();
        dbMigrationInit = module.get(DbInitMigrationConsole);
        dbMigrationCreate = module.get(DbCreateMigrationConsole);
        dbMigrationApply = module.get(DbApplyMigrationConsole);

        orm = module.get(MikroORM);
        fs.rmSync('test-migrations', { recursive: true, force: true });
    }, 2 * DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await orm.close();
        await module.close();
    });

    it('should be defined', () => {
        expect(dbMigrationInit).toBeDefined();
        expect(dbMigrationCreate).toBeDefined();
        expect(dbMigrationApply).toBeDefined();
    });

    describe('run', () => {
        describe('when migration-init is executed', () => {
            it('should not throw an error', async () => {
                await expect(dbMigrationInit.run([])).resolves.not.toThrow();
            });
        });

        describe('when migration-create is executed', () => {
            it('should not throw an error', async () => {
                await expect(dbMigrationCreate.run([])).resolves.not.toThrow();
            });
        });

        describe('when migration-apply is executed', () => {
            it('should not throw an error', async () => {
                await expect(dbMigrationApply.run([])).resolves.not.toThrow();
            });
        });
    });

    describe('DbApplyMigrationConsole', () => {
        it('should apply all pending migrations', async () => {
            const migrations: UmzugMigration[] = [{ name: '20210101_initialS.ts' }, { name: '20210202_dataD.ts' }];
            migrator.getPendingMigrations.mockResolvedValue(migrations);
            await dbMigrationApply.run([]);
            expect(migrator.up).toHaveBeenCalledWith(migrations.map((m: UmzugMigration) => m.name));
        });

        it('should filter and apply only structural migrations', async () => {
            const migrations: UmzugMigration[] = [{ name: '20210101_initialS.ts' }, { name: '20210202_dataD.ts' }];
            migrator.getPendingMigrations.mockResolvedValue(migrations);
            await dbMigrationApply.run([], { migration: 'structural' });
            expect(migrator.up).toHaveBeenCalledWith(['20210101_initialS.ts']);
        });

        it('should filter and apply only data migrations', async () => {
            const migrations: UmzugMigration[] = [{ name: '20210101_initialS.ts' }, { name: '20210202_dataD.ts' }];
            migrator.getPendingMigrations.mockResolvedValue(migrations);
            await dbMigrationApply.run([], { migration: 'data' });
            expect(migrator.up).toHaveBeenCalledWith(['20210202_dataD.ts']);
        });

        it('should throw an error if any migration does not end with S or D', async () => {
            const migrations: UmzugMigration[] = [{ name: '20210101_initial.ts' }];
            migrator.getPendingMigrations.mockResolvedValue(migrations);
            await expect(dbMigrationApply.run([])).rejects.toThrow('Not all migrations end with a S or D');
        });
    });

    describe('parseMigrationOption', () => {
        it('should return STRUCTURAL for "structural"', () => {
            expect(dbMigrationApply.parseMigrationOption('structural')).toBe(MigrationType.STRUCTURAL);
        });

        it('should return DATA for "data"', () => {
            expect(dbMigrationApply.parseMigrationOption('data')).toBe(MigrationType.DATA);
        });

        it('should return All for any other value', () => {
            expect(dbMigrationApply.parseMigrationOption('anything')).toBe(MigrationType.All);
        });
    });
});
