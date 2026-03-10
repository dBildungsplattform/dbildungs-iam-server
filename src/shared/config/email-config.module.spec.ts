import { Test, TestingModule } from '@nestjs/testing';

import { DbConfig } from './db.config';
import { EmailAppConfig } from './email-app.config';
import { EmailConfigModule } from './email-config.module';
import { LoggingConfig } from './logging.config';

describe('EmailConfigModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [EmailConfigModule],
        }).compile();
    });

    afterAll(async () => {
        await module?.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    it('should export EmailAppConfig', () => {
        expect(module.get(EmailAppConfig)).toBeDefined();
    });

    it('should export LoggingConfig', () => {
        expect(module.get(LoggingConfig)).toBeDefined();
    });

    it('should export DbConfig', () => {
        expect(module.get(DbConfig)).toBeDefined();
    });
});
