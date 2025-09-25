import { Module } from '@nestjs/common';
import { LoggerModule } from '../../../core/logging/logger.module.js';
import { HttpModule } from '@nestjs/axios';
import { SetEmailAddressForSpshPersonService } from './domain/set-email-address-for-spsh-person.service.js';
import { EmailAddressRepo } from './persistence/email-address.repo.js';
import { EmailDomainRepo } from './persistence/email-domain.repo.js';

@Module({
    imports: [HttpModule, LoggerModule.register(EmailCoreModule.name)],
    providers: [SetEmailAddressForSpshPersonService, EmailAddressRepo, EmailDomainRepo],
    exports: [],
})
export class EmailCoreModule {}
