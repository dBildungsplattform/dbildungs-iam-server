import { Module, Global } from '@nestjs/common';
import { ReporterService } from './reporter.service.js';
import { MetricsModule } from './metrics.module.js';
import { MetricsController } from './metrics.controller.js';

@Global()
@Module({
    imports: [MetricsModule],
    providers: [ReporterService],
    exports: [ReporterService],
    controllers: [MetricsController],
})
export class ReporterModule {}
