import { Controller, Get } from '@nestjs/common';
import {
    HealthCheck,
    HealthCheckResult,
    HealthCheckService,
    HealthIndicatorResult,
    MikroOrmHealthIndicator,
} from '@nestjs/terminus';
import { EntityManager } from '@mikro-orm/postgresql';
import { ApiExcludeController } from '@nestjs/swagger';

@Controller('health')
@ApiExcludeController()
export class HealthController {
    public constructor(
        private health: HealthCheckService,
        private mikroOrm: MikroOrmHealthIndicator,
        private em: EntityManager,
    ) {}

    @Get()
    @HealthCheck()
    public check(): Promise<HealthCheckResult> {
        return this.health.check([
            (): Promise<HealthIndicatorResult> =>
                this.mikroOrm.pingCheck('database', { connection: this.em.getConnection() }),
        ]);
    }
}
