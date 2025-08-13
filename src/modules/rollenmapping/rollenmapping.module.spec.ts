import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule, MapperTestModule } from '../../../test/utils/index.js';
import { RollenMappingFactory } from './domain/rollenmapping.factory.js';
import { RollenMappingRepo } from './repo/rollenmapping.repo.js';
import { RollenMappingModule } from './rollenmapping.module.js';

describe('RollenMappingModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, MapperTestModule, DatabaseTestModule.forRoot(), RollenMappingModule],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    describe('when module is initialized', () => {
        it('should resolve RollenMappingRepo', () => {
            expect(module.get(RollenMappingRepo)).toBeInstanceOf(RollenMappingRepo);
        });

        it('should resolve RollenMappingFactory', () => {
            expect(module.get(RollenMappingFactory)).toBeInstanceOf(RollenMappingFactory);
        });
    });
});
