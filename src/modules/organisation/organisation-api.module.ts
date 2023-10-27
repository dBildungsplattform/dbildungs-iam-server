import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { OrganisationController } from './api/organisation.controller.js';
import { OrganisationModule } from './organisation.module.js';
import { OrganisationUc } from './api/organisation.uc.js';
import { OrganisationApiMapperProfile } from './api/organisation-api.mapper.profile.js';

@Module({
    imports: [LoggerModule.register(OrganisationModule.name),OrganisationModule],
    providers: [OrganisationApiMapperProfile, OrganisationUc],
    controllers: [OrganisationController],
})
export class OrganisationApiModule {}
