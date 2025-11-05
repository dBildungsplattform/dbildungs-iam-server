import { Test, TestingModule } from '@nestjs/testing';
import { ConfigTestModule, DatabaseTestModule, LoggingTestModule } from '../../../test/utils/index.js';
import { EmailMicroserviceModule } from './email-microservice.module.js';

describe('EmailMicroserviceModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, LoggingTestModule, DatabaseTestModule.forRoot(), EmailMicroserviceModule],
            providers: [],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });
});
