import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';

@Module({
    imports: [LoggerModule.register(ServiceProviderModule.name)],
})
export class ServiceProviderModule {}
