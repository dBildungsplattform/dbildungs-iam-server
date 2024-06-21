import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { TelemetryService } from './services/telemetry.service.js';
import { ClassLogger } from '../logging/class-logger.js';
import { LoggerModule } from '../logging/logger.module.js';

@Module({
    imports: [LoggerModule.register(TelemetryModule.name)],
    providers: [TelemetryService],
    exports: [TelemetryService],
})
export class TelemetryModule implements OnApplicationBootstrap {
    public constructor(private readonly logger: ClassLogger) {}

    public onApplicationBootstrap(): void {
        this.logger.info('Telemetry module initialized.');
    }
}
