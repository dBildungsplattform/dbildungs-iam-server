import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { HealthCheckService, HealthCheck, HealthCheckResult } from '@nestjs/terminus';
import { Public } from 'nest-keycloak-connect';

@Controller('health')
@ApiExcludeController()
export class HealthController {
    public constructor(private health: HealthCheckService) {}

    @Get()
    @Public()
    @HealthCheck()
    public check(): Promise<HealthCheckResult> {
        return this.health.check([]);
    }
}
