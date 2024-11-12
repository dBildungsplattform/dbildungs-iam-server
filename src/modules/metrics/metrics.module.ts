import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service.js';
import { MetricsController } from './metrics.controller.js';
import { Registry } from 'prom-client';

@Module({
    controllers: [MetricsController],
    providers: [
        MetricsService,
        {
            provide: Registry,
            useValue: new Registry(),
        },
    ],
    exports: [MetricsService, Registry],
})
export class MetricsModule {}
