import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { RolleRepo } from './repo/rolle.repo.js';
import { ServiceProviderModule } from '../service-provider/service-provider.module.js';
import { ServiceProviderRepo } from '../service-provider/repo/service-provider.repo.js';
import { RolleFactory } from './domain/rolle.factory.js';

@Module({
    imports: [ServiceProviderModule, LoggerModule.register(RolleModule.name)],
    providers: [RolleRepo, RolleFactory, ServiceProviderRepo],
    exports: [RolleRepo, RolleFactory],
})
export class RolleModule {}
