import { Module } from '@nestjs/common';
import { ImportWorkflowFactory } from './domain/import-workflow.factory.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { OrganisationModule } from '../organisation/organisation.module.js';
import { ImportDataRepository } from './persistence/import-data.repository.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { ImportVorgangRepository } from './persistence/import-vorgang.repository.js';

@Module({
    imports: [RolleModule, OrganisationModule, PersonenKontextModule, LoggerModule.register(ImportModule.name)],
    providers: [ImportWorkflowFactory, ImportDataRepository, ImportVorgangRepository],
    exports: [ImportWorkflowFactory, ImportVorgangRepository],
})
export class ImportModule {}
