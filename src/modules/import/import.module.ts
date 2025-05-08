import { Module } from '@nestjs/common';
import { ImportWorkflowFactory } from './domain/import-workflow.factory.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { OrganisationModule } from '../organisation/organisation.module.js';
import { ImportDataRepository } from './persistence/import-data.repository.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { ImportVorgangRepository } from './persistence/import-vorgang.repository.js';
import { ImportEventHandler } from './domain/import-event-handler.js';
import { EventModule } from '../../core/eventbus/event.module.js';
import { ImportPasswordEncryptor } from './domain/import-password-encryptor.js';
import { AuthenticationModule } from '../authentication/authentication.module.js';

@Module({
    imports: [
        RolleModule,
        OrganisationModule,
        PersonenKontextModule,
        LoggerModule.register(ImportModule.name),
        EventModule,
        AuthenticationModule,
    ],
    providers: [
        ImportWorkflowFactory,
        ImportDataRepository,
        ImportVorgangRepository,
        ImportEventHandler,
        ImportPasswordEncryptor,
    ],
    exports: [ImportWorkflowFactory, ImportVorgangRepository, ImportDataRepository],
})
export class ImportModule {}
