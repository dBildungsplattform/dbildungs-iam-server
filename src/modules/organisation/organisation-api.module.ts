import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { OrganisationController } from './api/organisation.controller.js';
import { OrganisationModule } from './organisation.module.js';
import { OrganisationApiMapperProfile } from './api/organisation-api.mapper.profile.js';
import { EventModule } from '../../core/eventbus/index.js';

@Module({
    imports: [LoggerModule.register(OrganisationModule.name), OrganisationModule, EventModule],
    providers: [OrganisationApiMapperProfile],
    controllers: [OrganisationController],
})
export class OrganisationApiModule {}
