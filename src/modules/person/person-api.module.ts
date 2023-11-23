import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { PersonApiMapperProfile } from './api/person-api.mapper.profile.js';
import { PersonController } from './api/person.controller.js';
import { PersonUc } from './api/person.uc.js';
import { PersonModule } from './person.module.js';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';
import { PersonenkontextUc } from './api/personenkontext.uc.js';
import { PersonenkontextController } from './api/personenkontext.controller.js';

@Module({
    imports: [PersonModule, KeycloakAdministrationModule, LoggerModule.register(PersonApiModule.name)],
    providers: [PersonApiMapperProfile, PersonUc, PersonenkontextUc],
    controllers: [PersonController, PersonenkontextController],
})
export class PersonApiModule {}
