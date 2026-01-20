import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckResult, HealthCheckService, HealthIndicatorResult } from '@nestjs/terminus';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '../../../modules/authentication/api/public.decorator.js';
import { EmailHealthIndicator } from './email-health-indicator.js';

@Controller('health')
@ApiExcludeController()
export class EmailHealthController {
    public constructor(
        private health: HealthCheckService,
        private emailHealthIndicator: EmailHealthIndicator,
    ) {}

    @Get()
    @Public()
    @HealthCheck()
    public check(): Promise<HealthCheckResult> {
        return this.health.check([(): Promise<HealthIndicatorResult> => this.emailHealthIndicator.check()]);
    }
}
