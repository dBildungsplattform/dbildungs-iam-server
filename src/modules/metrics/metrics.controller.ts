import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Inject } from '@nestjs/common';
import { Registry } from 'prom-client';
import { Public } from '../authentication/api/public.decorator.js';
import { ReporterService } from './reporter/reporter.service.js';
import { DBiamPersonenkontextRepo, RollenCount } from '../personenkontext/persistence/dbiam-personenkontext.repo.js';

@ApiTags('Metrics')
@Controller({ path: 'metrics' })
export class MetricsController {
    public constructor(
        @Inject(Registry)
        private readonly registry: Registry,
        private readonly reporterService: ReporterService,
        private readonly dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
    ) {}

    @Get()
    @ApiOperation({ summary: 'Get Prometheus metrics' })
    @ApiResponse({ status: 200, description: 'Prometheus metrics.' })
    @Public()
    public async getMetrics(): Promise<string> {
        const personenKontextRollenCountResult: RollenCount[] =
            await this.dBiamPersonenkontextRepo.getPersonenkontextRollenCount();

        personenKontextRollenCountResult.forEach((entry: RollenCount) => {
            this.reporterService.gauge('personenkontext_rollen_count', parseInt(entry.count), {
                rollenart: entry.rollenart,
            });
        });
        const result: string = await this.registry.metrics();

        return result;
    }
}
