import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService, HealthIndicatorFunction, MikroOrmHealthIndicator } from '@nestjs/terminus';
import { EmailHealthController } from './email-health.controller.js';
import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';

describe('EmailHealthController', () => {
    let controller: EmailHealthController;
    let healthCheckService: DeepMocked<HealthCheckService>;
    let mikroOrmHealthIndicator: MikroOrmHealthIndicator;

    beforeAll(async () => {
        healthCheckService = createMock(HealthCheckService);
        mikroOrmHealthIndicator = createMock(MikroOrmHealthIndicator);

        const module: TestingModule = await Test.createTestingModule({
            controllers: [EmailHealthController],
            providers: [
                { provide: HealthCheckService, useValue: healthCheckService },
                { provide: MikroOrmHealthIndicator, useValue: mikroOrmHealthIndicator },
            ],
        }).compile();

        controller = module.get<EmailHealthController>(EmailHealthController);
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
            // eslint-disable-next-line @typescript-eslint/await-thenable
            await Promise.all(lastCallArguments.map((hif: HealthIndicatorFunction) => hif.call(hif)));
        }
        expect(mikroOrmHealthIndicator.pingCheck).toHaveBeenCalledWith('database', { timeout: 1500 });
    });
});
