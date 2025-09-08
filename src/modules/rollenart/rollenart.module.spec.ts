import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule } from '../../../test/utils/config-test.module.js';
import { RollenartRepo } from './repo/rollenart.repo.js';
import { RollenartModule } from './rollenart.module.js';

describe('RollenartModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [RollenartModule, ConfigTestModule],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    describe('when module is initialized', () => {
        it('should resolve RollenartRepo', () => {
            expect(module.get(RollenartRepo)).toBeInstanceOf(RollenartRepo);
        });
    });
});
