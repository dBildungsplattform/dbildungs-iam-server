import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService, HealthIndicatorFunction } from '@nestjs/terminus';
import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { EmailHealthController } from './email-health.controller.js';
import { EmailHealthIndicator } from './email-health-indicator.js';
import { EmailConfigTestModule } from '../../../../test/utils/email-config-test.module.js';

describe('EmailHealthController', () => {
    let controller: EmailHealthController;

    let healthCheckService: DeepMocked<HealthCheckService>;
    let emailHealthIndicator: DeepMocked<EmailHealthIndicator>;

    beforeAll(async () => {
        healthCheckService = createMock(HealthCheckService);
        emailHealthIndicator = createMock(EmailHealthIndicator);

        const module: TestingModule = await Test.createTestingModule({
            controllers: [EmailHealthController, EmailConfigTestModule],
            providers: [
                { provide: HealthCheckService, useValue: healthCheckService },
                { provide: EmailHealthIndicator, useValue: createMock(EmailHealthIndicator) },
            ],
        }).compile();

        controller = module.get<EmailHealthController>(EmailHealthController);
        emailHealthIndicator = module.get(EmailHealthIndicator);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should Perform all health checks', async () => {
        await controller.check();

        expect(healthCheckService.check).toHaveBeenCalled();
        const lastCallArguments: HealthIndicatorFunction[] | undefined = healthCheckService.check.mock.lastCall?.[0];
        expect(lastCallArguments).toBeDefined();

        if (lastCallArguments) {
            await Promise.all(lastCallArguments.map((hif: HealthIndicatorFunction) => hif.call(hif)));
        }
        expect(emailHealthIndicator.check).toHaveBeenCalled();
    });
});
