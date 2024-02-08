import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { PersonApiMapperProfile } from './api/person-api.mapper.profile.js';
import { PersonController } from './api/person.controller.js';
import { PersonUc } from './api/person.uc.js';
import { PersonModule } from './person.module.js';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';
import { PersonenkontextUc } from '../person-kontext/api/personenkontext.uc.js';
import { PersonenkontextController } from '../person-kontext/api/personenkontext.controller.js';
import { UserModule } from '../user/user.module.js';
import { PersonFrontendController } from './api/person.frontend.controller.js';

@Module({
    imports: [PersonModule, KeycloakAdministrationModule, UserModule, LoggerModule.register(PersonApiModule.name)],
    providers: [PersonApiMapperProfile, PersonUc, PersonenkontextUc],
    controllers: [PersonController, PersonenkontextController, PersonFrontendController],
})
export class PersonApiModule {}
