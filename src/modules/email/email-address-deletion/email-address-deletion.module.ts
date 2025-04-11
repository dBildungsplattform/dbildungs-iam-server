import { Module } from '@nestjs/common';
import { LoggerModule } from '../../../core/logging/logger.module.js';
import { EmailModule } from '../email.module.js';
import { EmailAddressDeletionService } from './email-address-deletion.service.js';
import { PersonModule } from '../../person/person.module.js';

@Module({
    imports: [EmailModule, PersonModule, LoggerModule.register(EmailAddressDeletionModule.name)],
    providers: [EmailAddressDeletionService],
    exports: [EmailAddressDeletionService],
})
export class EmailAddressDeletionModule {}
