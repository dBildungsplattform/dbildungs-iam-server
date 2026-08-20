import { Controller, Get } from '@nestjs/common';
import {
    HealthCheck,
    HealthCheckResult,
    HealthCheckService,
    HealthIndicatorResult,
    MikroOrmHealthIndicator,
} from '@nestjs/terminus';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '../../../modules/authentication/api/public.decorator.js';

@Controller('health')
@ApiExcludeController()
export class EmailHealthController {
    public constructor(
        private readonly health: HealthCheckService,
        private readonly mikroOrm: MikroOrmHealthIndicator,
    ) {}

    @Get()
    @Public()
    @HealthCheck()
    public async check(): Promise<HealthCheckResult> {
        try {
            const result: HealthIndicatorResult = await this.mikroOrm.pingCheck('database', {
                timeout: 1500,
            });

            console.log('health result', result);

            // eslint-disable-next-line @typescript-eslint/require-await
            return this.health.check([async () => result]);
        } catch (error) {
            console.error('health error', error);
            throw error;
        }
    }
}
