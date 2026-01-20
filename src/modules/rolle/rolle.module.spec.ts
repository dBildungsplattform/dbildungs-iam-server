import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule } from '../../../test/utils/index.js';
import { RolleRepo } from './repo/rolle.repo.js';
import { RolleModule } from './rolle.module.js';

describe('RolleModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot(), RolleModule],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    describe('when module is initialized', () => {
        it('should resolve RolleRepo', () => {
            expect(module.get(RolleRepo)).toBeInstanceOf(RolleRepo);
        });
    });
});
