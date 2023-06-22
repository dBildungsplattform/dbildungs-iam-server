import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleModule } from './console.module.js';
import { DbConsole } from './db.console.js';
import { DbInitConsole } from './db-init.console.js';

describe('ConsoleModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConsoleModule],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    describe('when module is initialized', () => {
        it('should resolve DbConsole', () => {
            const service = module.get(DbConsole);
            expect(service).toBeInstanceOf(DbConsole);
        });

        it('should resolve DbInitConsole', () => {
            const service = module.get(DbInitConsole);
            expect(service).toBeInstanceOf(DbInitConsole);
        });
    });
});
