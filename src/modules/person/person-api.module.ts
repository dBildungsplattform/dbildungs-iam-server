import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { PersonApiMapperProfile } from './api/person-api.mapper.profile.js';
import { PersonController } from './api/person.controller.js';
import { PersonModule } from './person.module.js';
import { PersonFrontendController } from './api/person.frontend.controller.js';
import { PersonenkontextUc } from '../personenkontext/api/personenkontext.uc.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';
import { UsernameGeneratorService } from './domain/username-generator.service.js';
import { PersonRepository } from './persistence/person.repository.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { OrganisationModule } from '../organisation/organisation.module.js';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';
import { DBiamPersonenuebersichtController } from './api/personenuebersicht/dbiam-personenuebersicht.controller.js';
import { DBiamPersonenkontextRepo } from '../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonInfoController } from './api/person-info.controller.js';
import { PersonApiMapper } from './mapper/person-api.mapper.js';
import { DBiamPersonController } from './api/dbiam-person.controller.js';
import { EventModule } from '../../core/eventbus/event.module.js';

@Module({
    imports: [
        PersonModule,
        RolleModule,
        OrganisationModule,
        PersonenKontextModule,
        OrganisationModule,
        KeycloakAdministrationModule,
        LoggerModule.register(PersonApiModule.name),
        EventModule,
    ],
    providers: [
        PersonApiMapperProfile,
        PersonenkontextUc,
        UsernameGeneratorService,
        PersonRepository,
        DBiamPersonenkontextRepo,
        PersonApiMapper,
    ],
    controllers: [
        PersonController,
        PersonFrontendController,
        DBiamPersonenuebersichtController,
        PersonInfoController,
        DBiamPersonController,
    ],
})
export class PersonApiModule {}
