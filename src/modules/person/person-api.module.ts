import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { PersonApiMapperProfile } from './api/person-api.mapper.profile.js';
import { PersonController } from './api/person.controller.js';
import { PersonModule } from './person.module.js';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';
import { PersonFrontendController } from './api/person.frontend.controller.js';
import { PersonenkontextUc } from '../personenkontext/api/personenkontext.uc.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';

@Module({
    imports: [
        PersonModule,
        PersonenKontextModule,
        KeycloakAdministrationModule,
        LoggerModule.register(PersonApiModule.name),
    ],
    providers: [PersonApiMapperProfile, PersonenkontextUc],
    controllers: [PersonController, PersonFrontendController],
})
export class PersonApiModule {}
