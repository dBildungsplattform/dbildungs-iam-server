import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleModule } from './console.module.js';
import { DbConsole } from './db.console.js';
import { DbInitConsole } from './db-init.console.js';
import { ConfigTestModule, LoggingTestModule } from '../../test/utils/index.js';

describe('ConsoleModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, ConsoleModule, LoggingTestModule],
        }).compile();
    });

    afterAll(async () => {
        if (module) {
            await module.close();
        }
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    describe('when module is initialized', () => {
        it('should resolve DbConsole', () => {
            const service: DbConsole = module.get(DbConsole);
            expect(service).toBeInstanceOf(DbConsole);
        });

        it('should resolve DbInitConsole', () => {
            const service: DbInitConsole = module.get(DbInitConsole);
            expect(service).toBeInstanceOf(DbInitConsole);
        });
    });
});
