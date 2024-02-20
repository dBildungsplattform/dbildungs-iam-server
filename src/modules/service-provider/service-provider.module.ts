import { Module } from '@nestjs/common';

import { LoggerModule } from '../../core/logging/logger.module.js';
import { ServiceProviderRepo } from './repo/service-provider.repo.js';

@Module({
    imports: [LoggerModule.register(ServiceProviderModule.name)],
    providers: [ServiceProviderRepo],
    exports: [ServiceProviderRepo],
})
export class ServiceProviderModule {}
