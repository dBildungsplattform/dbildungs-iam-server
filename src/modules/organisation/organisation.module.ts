import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { OrganisationRepo } from './persistence/organisation.repo.js';
import { OrganisationService } from './domain/organisation.service.js';
import { OrganisationPersistenceMapperProfile } from './persistence/organisation-persistence.mapper.profile.js';

@Module({
    imports: [LoggerModule.register(OrganisationModule.name)],
    providers: [OrganisationPersistenceMapperProfile, OrganisationRepo, OrganisationService],
    exports: [OrganisationService, OrganisationRepo],
})
export class OrganisationModule {}
