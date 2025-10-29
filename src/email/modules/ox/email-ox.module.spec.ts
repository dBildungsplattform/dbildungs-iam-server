import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule } from '../../../../test/utils';
import { EmailOxModule } from './email-ox.module';
import { OxSendService } from './domain/ox-send.service';

describe('OxModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, EmailOxModule, DatabaseTestModule.forRoot()],
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
            expect(module.get(OxSendService)).toBeInstanceOf(OxSendService);
        });
    });
});
