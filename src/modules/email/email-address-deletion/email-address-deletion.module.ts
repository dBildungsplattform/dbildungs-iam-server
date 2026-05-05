import { Module } from '@nestjs/common';
import { LoggerModule } from '../../../core/logging/logger.module.js';
import { EmailAddressDeletionService } from './email-address-deletion.service.js';
import { PersonModule } from '../../person/person.module.js';
import { EmailAddressDeletionHandler } from './email-address-deletion-handler.js';
import { EmailPersistenceModule } from '../email-persistence.module.js';

@Module({
    imports: [EmailPersistenceModule, PersonModule, LoggerModule.register(EmailAddressDeletionModule.name)],
    providers: [EmailAddressDeletionService, EmailAddressDeletionHandler],
    exports: [EmailAddressDeletionService, EmailAddressDeletionHandler],
})
export class EmailAddressDeletionModule {}
