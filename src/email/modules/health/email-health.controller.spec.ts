import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService, HealthIndicatorFunction } from '@nestjs/terminus';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { EmailHealthController } from './email-health.controller.js';
import { EmailHealthIndicator } from './email-health-indicator.js';

describe('EmailHealthController', () => {
    let controller: EmailHealthController;

    let healthCheckService: DeepMocked<HealthCheckService>;
    let emailHealthIndicator: DeepMocked<EmailHealthIndicator>;

    let configService: DeepMocked<ConfigService>;

    beforeAll(async () => {
        healthCheckService = createMock<HealthCheckService>();
        emailHealthIndicator = createMock<EmailHealthIndicator>();
        configService = createMock<ConfigService>();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [EmailHealthController],
            providers: [
                { provide: HealthCheckService, useValue: healthCheckService },
                { provide: ConfigService, useValue: configService },
                { provide: EmailHealthIndicator, useValue: createMock<EmailHealthIndicator>() },
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
