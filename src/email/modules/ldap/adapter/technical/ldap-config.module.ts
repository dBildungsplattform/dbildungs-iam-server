import { Module } from '@nestjs/common';
import { LdapInstanceConfig } from './ldap-instance-config.js';

@Module({
    providers: [LdapInstanceConfig.fromConfigService()],
    exports: [LdapInstanceConfig],
})
export class EmailLdapConfigModule {}
