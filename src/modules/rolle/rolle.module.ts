import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { RolleRepo } from './repo/rolle.repo.js';
import { ServiceProviderModule } from '../service-provider/service-provider.module.js';
import { ServiceProviderRepo } from '../service-provider/repo/service-provider.repo.js';
import { RolleFactory } from './domain/rolle.factory.js';
import { EventModule } from '../../core/eventbus/event.module.js';
import { EventService } from '../../core/eventbus/index.js';

@Module({
    imports: [ServiceProviderModule, LoggerModule.register(RolleModule.name), EventModule],
    providers: [RolleRepo, RolleFactory, ServiceProviderRepo, EventService],
    exports: [RolleRepo, RolleFactory],
})
export class RolleModule {}
