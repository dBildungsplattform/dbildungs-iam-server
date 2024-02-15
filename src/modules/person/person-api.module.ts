import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { PersonApiMapperProfile } from './api/person-api.mapper.profile.js';
import { PersonController } from './api/person.controller.js';
import { PersonUc } from './api/person.uc.js';
import { PersonModule } from './person.module.js';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';
import { UserModule } from '../user/user.module.js';
import { PersonFrontendController } from './api/person.frontend.controller.js';
import { PersonenkontextUc } from '../personenkontext/api/personenkontext.uc.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';
import { UsernameGeneratorService } from '../user/username-generator.service.js';

@Module({
    imports: [
        PersonModule,
        PersonenKontextModule,
        KeycloakAdministrationModule,
        UserModule,
        LoggerModule.register(PersonApiModule.name),
    ],
    providers: [PersonApiMapperProfile, PersonUc, PersonenkontextUc, UsernameGeneratorService],
    controllers: [PersonController, PersonFrontendController],
})
export class PersonApiModule {}
