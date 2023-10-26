import { Module } from '@nestjs/common';
import { PersonApiMapperProfile } from './api/person-api.mapper.profile.js';
import { PersonController } from './api/person.controller.js';
import { PersonUc } from './api/person.uc.js';
import { PersonModule } from './person.module.js';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';
import { PersonenkontextUc } from './api/personenkontext.uc.js';
import { ResultHttpService } from '../../shared/util/result-http.service.js';

@Module({
    imports: [PersonModule, KeycloakAdministrationModule],
    providers: [PersonApiMapperProfile, PersonUc, PersonenkontextUc, ResultHttpService],
    controllers: [PersonController],
})
export class PersonApiModule {}
