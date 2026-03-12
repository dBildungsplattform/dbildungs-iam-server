import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckResult, HealthCheckService, HealthIndicatorResult } from '@nestjs/terminus';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '../../../modules/authentication/api/public.decorator.js';

@Controller('health')
@ApiExcludeController()
export class EmailHealthController {
    public constructor(private health: HealthCheckService) {}

    @Get()
    @Public()
    @HealthCheck()
    public check(): Promise<HealthCheckResult> {
        // TODO check DB. maybe check OX and LDAP as well
        return this.health.check([(): Promise<HealthIndicatorResult> => Promise.resolve({ email: { status: 'up' } })]);
    }
}
