import { Module } from '@nestjs/common';
import { MetricsService } from './service/metrics.service.js';
import { MetricsController } from './metrics.controller.js';
import { Registry } from 'prom-client';
import { DBiamPersonenkontextRepo } from '../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';

@Module({
    imports: [PersonenKontextModule],
    controllers: [MetricsController],
    providers: [
        MetricsService,
        {
            provide: Registry,
            useValue: new Registry(),
        },
        DBiamPersonenkontextRepo,
    ],
    exports: [MetricsService, Registry],
})
export class MetricsModule {}
