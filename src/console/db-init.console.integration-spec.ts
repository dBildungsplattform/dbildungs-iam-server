import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule, LoggingTestModule } from '../shared/index.js';
import { DbInitConsole } from './db-init.console.js';

describe('DbInitConsole', () => {
    let module: TestingModule;
    let sut: DbInitConsole;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.register({ isDatabaseRequired: true }), LoggingTestModule],
            providers: [DbInitConsole],
        }).compile();
        sut = module.get(DbInitConsole);
    }, 30 * 1_000);

    afterAll(async () => {
        await module.close();
    }, 30 * 1_000);

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('run', () => {
        describe('when database is available', () => {
            it('should initialize database with schema', async () => {
                await expect(sut.run([])).resolves.not.toThrow();
            });
        });
    });
});
