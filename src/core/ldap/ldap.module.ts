import { Module } from '@nestjs/common';
import { LoggerModule } from '../logging/logger.module.js';
import { LdapEventHandler } from './domain/ldap-event-handler.js';
import { LdapClientService } from './domain/ldap-client.service.js';
import { RolleModule } from '../../modules/rolle/rolle.module.js';
import { OrganisationModule } from '../../modules/organisation/organisation.module.js';
import { PersonModule } from '../../modules/person/person.module.js';
import { LdapConfigModule } from './ldap-config.module.js';
import { PersonenKontextModule } from '../../modules/personenkontext/personenkontext.module.js';

@Module({
    imports: [
        LoggerModule.register(LdapModule.name),
        LdapConfigModule,
        RolleModule,
        PersonModule,
        OrganisationModule,
        PersonenKontextModule,
    ],
    providers: [LdapEventHandler, LdapClientService],
    exports: [LdapEventHandler, LdapClientService],
})
export class LdapModule {}
