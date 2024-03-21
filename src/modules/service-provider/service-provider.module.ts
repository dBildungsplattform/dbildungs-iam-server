import { Module } from '@nestjs/common';

import { LoggerModule } from '../../core/logging/logger.module.js';
import { ServiceProviderRepo } from './repo/service-provider.repo.js';
import { ServiceProviderFactory } from './domain/service-provider.factory.js';

@Module({
    imports: [LoggerModule.register(ServiceProviderModule.name)],
    providers: [ServiceProviderRepo, ServiceProviderFactory],
    exports: [ServiceProviderRepo, ServiceProviderFactory],
})
export class ServiceProviderModule {}
