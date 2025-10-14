import { Module } from '@nestjs/common';
import { LdapClientService } from './domain/ldap-client.service.js';
import { LdapConfigModule } from './ldap-config.module.js';
import { LdapClient } from './domain/ldap-client.js';
import { LoggerModule } from '../../../core/logging/logger.module.js';

@Module({
    imports: [LoggerModule.register(LdapModule.name), LdapConfigModule],
    providers: [LdapClientService, LdapClient],
    exports: [LdapClientService, LdapClient],
})
export class LdapModule {}
