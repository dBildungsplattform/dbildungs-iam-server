import { Module } from '@nestjs/common';
import { LoggerModule } from '../logging/logger.module.js';
import { LdapEventHandler } from './domain/ldap-event-handler.js';
import { LdapClientService } from './domain/ldap-client.service.js';
import { RolleModule } from '../../modules/rolle/rolle.module.js';
import { OrganisationModule } from '../../modules/organisation/organisation.module.js';
import { LdapConfigModule } from './ldap-config.module.js';
import { LdapClient } from './domain/ldap-client.js';

@Module({
    imports: [LoggerModule.register(LdapModule.name), LdapConfigModule, RolleModule, OrganisationModule],
    providers: [LdapEventHandler, LdapClientService, LdapClient],
    exports: [LdapEventHandler, LdapClientService, LdapClient],
})
export class LdapModule {}
