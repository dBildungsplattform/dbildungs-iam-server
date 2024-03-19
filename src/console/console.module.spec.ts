import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleModule } from './console.module.js';
import { DbConsole } from './db.console.js';
import { DbInitConsole } from './db-init.console.js';
import { RolleFactory } from '../modules/rolle/domain/rolle.factory.js';
import { ServiceProviderRepo } from '../modules/service-provider/repo/service-provider.repo.js';

describe('ConsoleModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConsoleModule],
            providers: [RolleFactory, ServiceProviderRepo],
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
            const service: DbConsole = module.get(DbConsole);
            expect(service).toBeInstanceOf(DbConsole);
        });

        it('should resolve DbInitConsole', () => {
            const service: DbInitConsole = module.get(DbInitConsole);
            expect(service).toBeInstanceOf(DbInitConsole);
        });
    });
});
