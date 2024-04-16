import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { ProviderController } from './api/provider.controller.js';
import { ServiceProviderModule } from './service-provider.module.js';
import { PersonPermissionsRepo } from '../authentication/domain/person-permission.repo.js';
import { PersonRepository } from '../person/persistence/person.repository.js';
import { DBiamPersonenkontextRepo } from '../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonenKontextApiModule } from '../personenkontext/personenkontext-api.module.js';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { StreamableFileFactory } from '../../shared/util/streamable-file.factory.js';

@Module({
    imports: [
        ServiceProviderModule,
        LoggerModule.register(ServiceProviderApiModule.name),
        PersonenKontextApiModule,
        KeycloakAdministrationModule,
        RolleModule,
    ],
    providers: [StreamableFileFactory, PersonPermissionsRepo, PersonRepository, DBiamPersonenkontextRepo],
    controllers: [ProviderController],
})
export class ServiceProviderApiModule {}
