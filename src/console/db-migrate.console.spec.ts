import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DatabaseTestModule,
    LoggingTestModule,
} from '../../test/utils/index.js';
import { DbMigrateConsole } from './db-migrate.console.js';
import fs from 'fs';

describe('DbMigrateConsole', () => {
    let module: TestingModule;
    let sut: DbMigrateConsole;
    let orm: MikroORM;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true }), LoggingTestModule],
            providers: [DbMigrateConsole],
        }).compile();
        sut = module.get(DbMigrateConsole);
        orm = module.get(MikroORM);
        fs.rmSync('test-migrations', { recursive: true, force: true });
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await orm.close();
        await module.close();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('run', () => {
        describe('when init parameter is provided', () => {
            it('should create init migration', async () => {
                await expect(sut.run(['init'])).resolves.not.toThrow();
            });
        });

        describe('when up parameter is provided', () => {
            it('should create init migration', async () => {
                await expect(sut.run(['up'])).resolves.not.toThrow();
            });
        });

        describe('when no parameter is provided', () => {
            it('should create new migration', async () => {
                await expect(sut.run([])).resolves.not.toThrow();
            });
        });

        describe('when unknown parameter is provided', () => {
            it('should throw error', async () => {
                await expect(sut.run(['unknownParameter'])).rejects.toThrow();
            });
        });
    });
});
