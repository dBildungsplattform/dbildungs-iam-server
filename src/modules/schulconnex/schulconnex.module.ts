import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { OrganisationModule } from '../organisation/organisation.module.js';
import { EmailModule } from '../email/email.module.js';
import { PersonenInfoController } from './api/personeninfo/personeninfo.controller.js';
import { PersonInfoController } from './api/personinfo/person-info.controller.js';
import { PersonenInfoService } from './domain/personeninfo/personeninfo.service.js';
import { PersonModule } from '../person/person.module.js';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';
import { SchulconnexRepo } from './persistence/schulconnex.repo.js';
import { EntityAggregateMapper } from '../person/mapper/entity-aggregate.mapper.js';

@Module({
    imports: [
        PersonModule,
        EmailModule,
        RolleModule,
        OrganisationModule,
        PersonenKontextModule,
        KeycloakAdministrationModule,
        LoggerModule.register(SchulconnexModule.name),
    ],
    providers: [PersonenInfoService, SchulconnexRepo, EntityAggregateMapper],
    controllers: [PersonInfoController, PersonenInfoController],
})
export class SchulconnexModule {}
