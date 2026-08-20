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
    public check(): Promise<HealthCheckResult> {
        return this.health.check([
            (): Promise<HealthIndicatorResult> => this.mikroOrm.pingCheck('database', { timeout: 15000 }),
        ]);
    }
}
