import { Module } from '@nestjs/common';
import { LoggerModule } from '../logging/logger.module.js';
import { LdapEventHandler } from './domain/ldap-event-handler.js';
import { LdapClientService } from './domain/ldap-client.service.js';
import { RolleModule } from '../../modules/rolle/rolle.module.js';
import { OrganisationModule } from '../../modules/organisation/organisation.module.js';
import { LdapConfigModule } from './ldap-config.module.js';
import { LdapClient } from './domain/ldap-client.js';
import { LdapSyncEventHandler } from './domain/ldap-sync-event-handler.js';
import { PersonModule } from '../../modules/person/person.module.js';
import { PersonenKontextModule } from '../../modules/personenkontext/personenkontext.module.js';
import { EmailMicroserviceModule } from '../../modules/email-microservice/email-microservice.module.js';
import { EmailPersistenceModule } from '../../modules/email/email-persistence.module.js';

@Module({
    imports: [
        LoggerModule.register(LdapModule.name),
        LdapConfigModule,
        RolleModule,
        OrganisationModule,
        PersonModule,
        PersonenKontextModule,
        EmailMicroserviceModule,
        EmailPersistenceModule,
    ],
    providers: [LdapEventHandler, LdapSyncEventHandler, LdapClientService, LdapClient],
    exports: [LdapEventHandler, LdapSyncEventHandler, LdapClientService, LdapClient],
})
export class LdapModule {}
