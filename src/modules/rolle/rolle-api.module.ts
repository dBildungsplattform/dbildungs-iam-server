import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { OrganisationModule } from '../organisation/organisation.module.js';
import { RolleController } from './api/rolle.controller.js';
import { RolleModule } from './rolle.module.js';
import { ServiceProviderModule } from '../service-provider/service-provider.module.js';

@Module({
    imports: [RolleModule, OrganisationModule, ServiceProviderModule, LoggerModule.register(RolleApiModule.name)],
    controllers: [RolleController],
})
export class RolleApiModule {}
