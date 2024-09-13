import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { OrganisationRepo } from './persistence/organisation.repo.js';
import { OrganisationService } from './domain/organisation.service.js';
import { OrganisationPersistenceMapperProfile } from './persistence/organisation-persistence.mapper.profile.js';
import { OrganisationRepository } from './persistence/organisation.repository.js';
import { EventModule } from '../../core/eventbus/index.js';
import { OrgRecService } from './domain/org-rec.service.js';

@Module({
    imports: [LoggerModule.register(OrganisationModule.name), EventModule],
    providers: [
        OrganisationPersistenceMapperProfile,
        OrganisationRepo,
        OrganisationService,
        OrganisationRepository,
        OrgRecService,
    ],
    exports: [OrganisationService, OrganisationRepo, OrganisationRepository, OrgRecService],
})
export class OrganisationModule {}
