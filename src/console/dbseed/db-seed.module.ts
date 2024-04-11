import { Module } from '@nestjs/common';

import { LoggerModule } from '../../core/logging/logger.module.js';
import { DbSeedService } from './db-seed.service.js';
import { DbSeedMapper } from './db-seed-mapper.js';
import { DbSeedConsole } from './db-seed.console.js';
import { PersonModule } from '../../modules/person/person.module.js';
import { PersonenKontextModule } from '../../modules/personenkontext/personenkontext.module.js';
import { DBiamPersonenkontextRepo } from '../../modules/personenkontext/persistence/dbiam-personenkontext.repo.js';
import { OrganisationModule } from '../../modules/organisation/organisation.module.js';
import { RolleModule } from '../../modules/rolle/rolle.module.js';
import { ServiceProviderModule } from '../../modules/service-provider/service-provider.module.js';
import { KeycloakAdminClient } from '@s3pweb/keycloak-admin-client-cjs';
import { KeycloakAdministrationService } from '../../modules/keycloak-administration/domain/keycloak-admin-client.service.js';
import { KeycloakUserService } from '../../modules/keycloak-administration/index.js';
import { KeycloakInstanceConfig } from '../../modules/keycloak-administration/keycloak-instance-config.js';

@Module({
    imports: [
        PersonModule,
        PersonenKontextModule,
        OrganisationModule,
        RolleModule,
        ServiceProviderModule,
        LoggerModule.register(DbSeedModule.name),
    ],
    providers: [
        DbSeedService,
        DbSeedMapper,
        DbSeedConsole,
        DBiamPersonenkontextRepo,
        KeycloakUserService,
        KeycloakAdministrationService,
        KeycloakAdminClient,
        KeycloakInstanceConfig.fromConfigService(),
    ],
    exports: [DbSeedService, DbSeedMapper, DbSeedConsole],
})
export class DbSeedModule {}
