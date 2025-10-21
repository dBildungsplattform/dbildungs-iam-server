import { Module } from '@nestjs/common';
import { LdapClientService } from './domain/ldap-client.service.js';
import { LdapClient } from './domain/ldap-client.js';
import { LoggerModule } from '../../../core/logging/logger.module.js';
import { EmailLdapConfigModule } from './ldap-config.module.js';

@Module({
    imports: [LoggerModule.register(EmailLdapModule.name), EmailLdapConfigModule],
    providers: [LdapClientService, LdapClient],
    exports: [LdapClientService, LdapClient],
})
export class EmailLdapModule {}
