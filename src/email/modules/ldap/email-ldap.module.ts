import { Module } from '@nestjs/common';
import { LdapClientAdapter } from './adapter/domain/ldap-client.adapter.js';
import { LdapClient } from './adapter/technical/ldap-client.js';
import { LoggerModule } from '../../../core/logging/logger.module.js';
import { EmailLdapConfigModule } from './adapter/technical/ldap-config.module.js';

@Module({
    imports: [LoggerModule.register(EmailLdapModule.name), EmailLdapConfigModule],
    providers: [LdapClientAdapter, LdapClient],
    exports: [LdapClientAdapter, LdapClient],
})
export class EmailLdapModule {}
