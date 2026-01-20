import { Module } from '@nestjs/common';

import { LoggerModule } from '../../core/logging/logger.module.js';
import { DbSeedService } from './domain/db-seed.service.js';
import { DbSeedConsole } from './db-seed.console.js';
import { PersonModule } from '../../modules/person/person.module.js';
import { PersonenKontextModule } from '../../modules/personenkontext/personenkontext.module.js';
import { OrganisationModule } from '../../modules/organisation/organisation.module.js';
import { RolleModule } from '../../modules/rolle/rolle.module.js';
import { ServiceProviderModule } from '../../modules/service-provider/service-provider.module.js';
import { KeycloakAdministrationModule } from '../../modules/keycloak-administration/keycloak-administration.module.js';
import { DbSeedRepo } from './repo/db-seed.repo.js';
import { DBiamPersonenkontextRepo } from '../../modules/personenkontext/persistence/dbiam-personenkontext.repo.js';
import { DbSeedReferenceRepo } from './repo/db-seed-reference.repo.js';
import { LdapModule } from '../../core/ldap/ldap.module.js';
import { EntityAggregateMapper } from '../../modules/person/mapper/entity-aggregate.mapper.js';
import { EmailCoreModule } from '../../email/modules/core/email-core.module.js';
import { EmailDomainRepo } from '../../email/modules/core/persistence/email-domain.repo.js';
@Module({
    imports: [
        LdapModule,
        PersonModule,
        PersonenKontextModule,
        OrganisationModule,
        RolleModule,
        ServiceProviderModule,
        KeycloakAdministrationModule,
        EmailCoreModule,
        LoggerModule.register(DbSeedModule.name),
    ],
    providers: [
        DbSeedService,
        DbSeedConsole,
        DBiamPersonenkontextRepo,
        EmailDomainRepo,
        DbSeedRepo,
        DbSeedReferenceRepo,
        EntityAggregateMapper,
    ],
    exports: [DbSeedService, DbSeedConsole, DbSeedRepo],
})
export class DbSeedModule {}
