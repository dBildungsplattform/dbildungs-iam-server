import { Module } from '@nestjs/common';
import { EventModule } from '../../core/eventbus/event.module.js';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { AuthenticationModule } from '../authentication/authentication.module.js';
import { OrganisationModule } from '../organisation/organisation.module.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { ImportEventHandler } from './domain/import-event-handler.js';
import { ImportPasswordEncryptor } from './domain/import-password-encryptor.js';
import { ImportWorkflowFactory } from './domain/import-workflow.factory.js';
import { ImportDataRepository } from './persistence/import-data.repository.js';
import { ImportVorgangRepository } from './persistence/import-vorgang.repository.js';

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
