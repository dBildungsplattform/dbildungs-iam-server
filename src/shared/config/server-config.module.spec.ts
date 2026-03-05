import { Test, TestingModule } from '@nestjs/testing';

import { DbConfig } from './db.config';
import { JsonConfig } from './json.config';
import { LoggingConfig } from './logging.config';
import { ServerConfigModule } from './server-config.module';

describe('ServerConfigModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ServerConfigModule],
        }).compile();
    });

    afterAll(async () => {
        await module?.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    it('should export JsonConfig', () => {
        expect(module.get(JsonConfig)).toBeDefined();
    });

    it('should export LoggingConfig', () => {
        expect(module.get(LoggingConfig)).toBeDefined();
    });

    it('should export DbConfig', () => {
        expect(module.get(DbConfig)).toBeDefined();
    });
});
