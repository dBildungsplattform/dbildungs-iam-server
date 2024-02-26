import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { OrganisationModule } from '../organisation/organisation.module.js';
import { RolleController } from './api/rolle.controller.js';
import { RolleModule } from './rolle.module.js';

@Module({
    imports: [RolleModule, OrganisationModule, LoggerModule.register(RolleApiModule.name)],
    controllers: [RolleController],
})
export class RolleApiModule {}
