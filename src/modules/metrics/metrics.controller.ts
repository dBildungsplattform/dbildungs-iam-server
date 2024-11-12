import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Inject } from '@nestjs/common';
import { Registry } from 'prom-client';
import { Public } from '../authentication/api/public.decorator.js';

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
        const result: string = await this.registry.metrics();
        return result;
    }
}
