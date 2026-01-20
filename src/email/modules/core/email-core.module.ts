import { Module } from '@nestjs/common';
import { LoggerModule } from '../../../core/logging/logger.module.js';
import { SetEmailAddressForSpshPersonService } from './domain/set-email-address-for-spsh-person.service.js';
import { EmailAddressRepo } from './persistence/email-address.repo.js';
import { EmailDomainRepo } from './persistence/email-domain.repo.js';
import { EmailReadController } from './api/controller/email-read.controller.js';
import { EmailWriteController } from './api/controller/email-write.controller.js';
import { EmailAddressGenerator } from './domain/email-address-generator.js';
import { EmailOxModule } from '../ox/email-ox.module.js';
import { EmailLdapModule } from '../ldap/email-ldap.module.js';
import { DeleteEmailsAddressesForSpshPersonService } from './domain/delete-email-adresses-for-spsh-person.service.js';
import { SetEmailSuspendedService } from './domain/set-email-suspended.service.js';

@Module({
    imports: [LoggerModule.register(EmailCoreModule.name), EmailOxModule, EmailLdapModule],
    providers: [
        SetEmailAddressForSpshPersonService,
        DeleteEmailsAddressesForSpshPersonService,
        SetEmailSuspendedService,
        EmailAddressRepo,
        EmailDomainRepo,
        EmailAddressGenerator,
    ],
    exports: [EmailAddressRepo, EmailDomainRepo],
    controllers: [EmailReadController, EmailWriteController],
})
export class EmailCoreModule {}
