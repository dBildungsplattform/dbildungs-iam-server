import { Test, TestingModule } from '@nestjs/testing';
import { RolleController } from './api/rolle.controller.js';
import { RolleApiModule } from './rolle-api.module.js';
import { ConfigTestModule } from '../../../test/utils/config-test.module.js';
import { DatabaseTestModule } from '../../../test/utils/database-test.module.js';

describe('RolleApiModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot(), RolleApiModule],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    describe('when module is initialized', () => {
        it('should resolve RolleController', () => {
            expect(module.get(RolleController)).toBeInstanceOf(RolleController);
        });
    });
});
