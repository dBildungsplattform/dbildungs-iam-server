import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Inject } from '@nestjs/common';
import { Registry } from 'prom-client';
import { Public } from '../authentication/api/public.decorator.js';
import { ReporterService } from './reporter/reporter.service.js';
import { RollenArt } from '../rolle/domain/rolle.enums.js';
import { DBiamPersonenkontextRepo } from '../personenkontext/persistence/dbiam-personenkontext.repo.js';

@ApiTags('Metrics')
@Controller({ path: 'metrics' })
export class MetricsController {
    public constructor(
        @Inject(Registry)
        private readonly registry: Registry,
        @Inject(ReporterService)
        private readonly reporterService: ReporterService,
        private readonly dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
    ) {}

    @Get()
    @Public()
    public async getMetrics(): Promise<string> {
        const mappingCountToRollenArt: Map<string, RollenArt> = new Map([
            ['number_of_teachers', RollenArt.LEHR],
            ['number_of_students', RollenArt.LERN],
            ['number_of_admins', RollenArt.LEIT],
        ]);

        await Promise.all(
            Array.from(mapping).map(async ([metric, rolle]: [string, RollenArt]) => {
                const count: number = await this.dBiamPersonenkontextRepo.getPersonCountByRole(rolle);
                this.reporterService.gauge(metric, count, { school: 'all' });
            }),
        );
        const result: string = await this.registry.metrics();

        return result;
    }
}
