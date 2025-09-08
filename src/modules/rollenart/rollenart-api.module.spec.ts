import { Test, TestingModule } from '@nestjs/testing';
import { RollenartApiModule } from './rollenart-api.module.js';
import { RollenartController } from './api/rollenart.controller.js';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { ConfigTestModule } from '../../../test/utils/config-test.module.js';

describe('RollenartApiModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, RollenartApiModule, LoggerModule],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    describe('when module is initialized', () => {
        it('should resolve RollenartController', () => {
            expect(module.get(RollenartController)).toBeInstanceOf(RollenartController);
        });
    });
});
