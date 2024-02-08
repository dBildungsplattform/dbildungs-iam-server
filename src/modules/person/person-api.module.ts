import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { PersonApiMapperProfile } from './api/person-api.mapper.profile.js';
import { PersonController } from './api/person.controller.js';
import { PersonUc } from './api/person.uc.js';
import { PersonModule } from './person.module.js';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';
import { UserModule } from '../user/user.module.js';
import { PersonFrontendController } from './api/person.frontend.controller.js';
import { PersonKontextModule } from '../person-kontext/person-kontext.module.js';
import { PersonenkontextUc } from '../person-kontext/api/personenkontext.uc.js';

@Module({
    imports: [
        PersonModule,
        PersonKontextModule,
        KeycloakAdministrationModule,
        UserModule,
        LoggerModule.register(PersonApiModule.name),
    ],
    providers: [PersonApiMapperProfile, PersonUc, PersonenkontextUc],
    controllers: [PersonController, PersonFrontendController],
})
export class PersonApiModule {}
