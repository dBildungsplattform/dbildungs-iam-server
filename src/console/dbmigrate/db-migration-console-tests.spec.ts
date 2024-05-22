import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DatabaseTestModule,
    LoggingTestModule,
} from '../../../test/utils/index.js';
import fs from 'fs';
import { DbInitMigrationConsole } from './db-init-migration.console.js';
import { DbApplyMigrationConsole } from './db-apply-migration.console.js';
import { DbCreateMigrationConsole } from './db-create-migration.console.js';

describe('DbMigrateConsole', () => {
    let module: TestingModule;
    let dbMigrationInit: DbInitMigrationConsole;
    let dbMigrationCreate: DbCreateMigrationConsole;
    let dbMigrationApply: DbApplyMigrationConsole;
    let orm: MikroORM;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true }), LoggingTestModule],
            providers: [DbInitMigrationConsole, DbCreateMigrationConsole, DbApplyMigrationConsole],
        }).compile();
        dbMigrationInit = module.get(DbInitMigrationConsole);
        dbMigrationCreate = module.get(DbCreateMigrationConsole);
        dbMigrationApply = module.get(DbApplyMigrationConsole);

        orm = module.get(MikroORM);
        fs.rmSync('test-migrations', { recursive: true, force: true });
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

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
});
