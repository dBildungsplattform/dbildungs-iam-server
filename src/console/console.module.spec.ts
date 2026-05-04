import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    EmailConfigTestModule,
    LoggingTestModule,
} from '../../test/utils/index.js';
import { ConsoleModule } from './console.module.js';
import { DbInitConsole } from './db-init.console.js';
import { DbConsole } from './db.console.js';

describe('ConsoleModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                EmailConfigTestModule,
                ConsoleModule,
                LoggingTestModule,
                DatabaseTestModule.forRoot(),
            ],
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
