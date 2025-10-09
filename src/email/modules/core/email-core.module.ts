import { Module } from '@nestjs/common';
import { LoggerModule } from '../../../core/logging/logger.module.js';
import { SetEmailAddressForSpshPersonService } from './domain/set-email-address-for-spsh-person.service.js';
import { EmailAddressRepo } from './persistence/email-address.repo.js';
import { EmailDomainRepo } from './persistence/email-domain.repo.js';
import { EmailReadController } from './api/controller/email-read.controller.js';
import { EmailWriteController } from './api/controller/email-write.controller.js';
import { EmailAddressStatusRepo } from './persistence/email-address-status.repo.js';
import { EmailAddressGenerator } from './domain/email-address-generator.js';

@Module({
    imports: [LoggerModule.register(EmailCoreModule.name)],
    providers: [
        SetEmailAddressForSpshPersonService,
        EmailAddressRepo,
        EmailDomainRepo,
        EmailAddressStatusRepo,
        EmailAddressGenerator,
    ],
    exports: [EmailAddressRepo, EmailDomainRepo, EmailAddressStatusRepo],
    controllers: [EmailReadController, EmailWriteController],
})
export class EmailCoreModule {}
