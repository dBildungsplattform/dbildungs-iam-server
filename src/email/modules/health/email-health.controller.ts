import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckResult, HealthCheckService } from '@nestjs/terminus';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '../../../modules/authentication/api/public.decorator.js';

@Controller('health')
@ApiExcludeController()
export class EmailHealthController {
    public constructor(private readonly health: HealthCheckService) {}

    @Get()
    @Public()
    @HealthCheck()
    public check(): Promise<HealthCheckResult> {
        return this.health.check([
            // eslint-disable-next-line @typescript-eslint/require-await
            async () => ({
                database: {
                    status: 'up',
                },
            }),
        ]);
    }
}
