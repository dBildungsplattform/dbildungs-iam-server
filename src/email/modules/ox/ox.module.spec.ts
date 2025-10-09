import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule } from '../../../../test/utils';
import { OxModule } from './ox.module';
import { OxService } from './domain/ox-service';

describe('OxModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, OxModule, DatabaseTestModule.forRoot()],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    describe('when module is initialized', () => {
        it('should resolve OxService', () => {
            expect(module.get(OxService)).toBeInstanceOf(OxService);
        });
    });
});
