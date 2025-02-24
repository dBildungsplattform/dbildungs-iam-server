import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module.js';
import { AppModule } from './app.module.js';

describe('AppModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    it('should import ConfigModule', () => {
        const configModule: ConfigModule = module.get(ConfigModule);
        expect(configModule).toBeDefined();
    });

    it('should import HealthModule', () => {
        const healthModule: HealthModule = module.get(HealthModule);
        expect(healthModule).toBeDefined();
    });
});
