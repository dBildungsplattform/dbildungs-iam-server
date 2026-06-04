import { Module } from '@nestjs/common';
import { LdapEmailMicroserviceInstanceConfig } from './ldap-email-microservice-instance-config.js';

@Module({
    providers: [LdapEmailMicroserviceInstanceConfig.fromConfigService()],
    exports: [LdapEmailMicroserviceInstanceConfig],
})
export class EmailLdapConfigModule {}
