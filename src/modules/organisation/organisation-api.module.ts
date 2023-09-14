import { Module } from '@nestjs/common';
import { OrganisationController } from './api/organisation.controller.js';
import { OrganisationModule } from './organisation.module.js';
import { OrganisationUc } from './api/organisation.uc.js';
import { OrganisationApiMapperProfile } from './api/organisation-api.mapper.js';

@Module({
    imports: [OrganisationModule],
    providers: [OrganisationApiMapperProfile, OrganisationUc],
    controllers: [OrganisationController],
})
export class OrganisationApiModule {}
