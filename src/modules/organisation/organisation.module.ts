import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { OrganisationService } from './domain/organisation.service.js';
import { OrganisationPersistenceMapperProfile } from './persistence/organisation-persistence.mapper.profile.js';
import { OrganisationRepository } from './persistence/organisation.repository.js';
import { EventModule } from '../../core/eventbus/index.js';

@Module({
    imports: [LoggerModule.register(OrganisationModule.name), EventModule],
    providers: [OrganisationPersistenceMapperProfile, OrganisationService, OrganisationRepository],
    exports: [OrganisationService, OrganisationRepository],
})
export class OrganisationModule {}
