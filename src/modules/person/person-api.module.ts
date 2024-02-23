import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { PersonApiMapperProfile } from './api/person-api.mapper.profile.js';
import { PersonController } from './api/person.controller.js';
import { PersonUc } from './api/person.uc.js';
import { PersonModule } from './person.module.js';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';
import { PersonFrontendController } from './api/person.frontend.controller.js';
import { PersonenkontextUc } from '../personenkontext/api/personenkontext.uc.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';
import { UsernameGeneratorService } from './domain/username-generator.service.js';
import { PersonRepository } from './persistence/person.repository.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { OrganisationModule } from '../organisation/organisation.module.js';

@Module({
    imports: [
        PersonModule,
        RolleModule,
        PersonenKontextModule,
        OrganisationModule,
        KeycloakAdministrationModule,
        LoggerModule.register(PersonApiModule.name),
    ],
    providers: [PersonApiMapperProfile, PersonUc, PersonenkontextUc, UsernameGeneratorService, PersonRepository],
    controllers: [PersonController, PersonFrontendController],
})
export class PersonApiModule {}
