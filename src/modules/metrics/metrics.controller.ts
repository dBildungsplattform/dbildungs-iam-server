import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Inject } from '@nestjs/common';
import { Registry } from 'prom-client';
import { Public } from '../authentication/api/public.decorator.js';
import { ReporterService } from './reporter.service.js';

@ApiTags('Metrics')
@Controller({ path: 'metrics' })
export class MetricsController {
    public constructor(
        @Inject(Registry)
        private readonly registry: Registry,
    ) {}

    @Get()
    @Public()
    public async getMetrics(): Promise<string> {
        ReporterService.gauge('number_of_teachers', 2522, { school: 'all' });
        ReporterService.gauge('number_of_students', 15203, { school: 'all' });
        ReporterService.gauge('number_of_admins', 101, { school: 'all' });
        const result: string = await this.registry.metrics();

        return result;
    }
}
