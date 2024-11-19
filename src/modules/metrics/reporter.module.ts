import { Module, Global } from '@nestjs/common';
import { ReporterService } from './reporter.service.js';
import { MetricsModule } from './metrics.module.js';

@Global()
@Module({
    imports: [MetricsModule],
    providers: [ReporterService],
    exports: [ReporterService],
})
export class ReporterModule {}
