import { Module } from '@nestjs/common';
import { OrganisationRepo } from './persistence/organisation.repo.js';
import { OrganisationService } from './domain/organisation.service.js';
import { OrganisationPersistenceMapperProfile } from './persistence/organisation-persistence.mapper.profile.js';

@Module({
    providers: [OrganisationPersistenceMapperProfile, OrganisationRepo, OrganisationService],
    exports: [OrganisationService],
})
export class OrganisationModule {}
