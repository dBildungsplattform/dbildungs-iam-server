import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { ProviderController } from './api/provider.controller.js';
import { ServiceProviderModule } from './service-provider.module.js';
import { StreamableFileFactory } from '../../shared/util/streamable-file.factory.js';

@Module({
    imports: [ServiceProviderModule, LoggerModule.register(ServiceProviderApiModule.name)],
    providers: [StreamableFileFactory],
    controllers: [ProviderController],
})
export class ServiceProviderApiModule {}
