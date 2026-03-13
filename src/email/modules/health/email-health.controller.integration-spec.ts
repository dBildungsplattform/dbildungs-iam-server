import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckResult } from '@nestjs/terminus';
import { EmailHealthController } from './email-health.controller.js';
import { EmailHealthModule } from './email-health.module.js';
import { ConfigTestModule, LoggingTestModule } from '../../../../test/utils/index.js';

describe('EmailHealthController', () => {
    let controller: EmailHealthController;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [EmailHealthModule, LoggingTestModule, ConfigTestModule],
            providers: [],
        }).compile();

        controller = module.get<EmailHealthController>(EmailHealthController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should Perform all health checks', async () => {
        const result: HealthCheckResult = await controller.check();

        expect(result.status).toBe('ok');
    });
});
