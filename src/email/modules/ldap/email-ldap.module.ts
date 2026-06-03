import { Module } from '@nestjs/common';
import { LdapClientService } from './domain/ldap-client.service.js';
import { LdapClient } from './domain/ldap-client.js';
import { LoggerModule } from '../../../core/logging/logger.module.js';
import { EmailLdapConfigModule } from './ldap-config.module.js';
import { LdapEmailMicroserviceInstanceConfig } from './ldap-email-microservice-instance-config.js';

@Module({
    imports: [LoggerModule.register(EmailLdapModule.name), EmailLdapConfigModule],
    providers: [LdapClientService, LdapClient, LdapEmailMicroserviceInstanceConfig.fromConfigService()],
    exports: [LdapClientService, LdapClient, LdapEmailMicroserviceInstanceConfig],
})
export class EmailLdapModule {}
