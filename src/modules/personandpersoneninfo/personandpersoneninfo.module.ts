import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { OrganisationModule } from '../organisation/organisation.module.js';
import { EmailModule } from '../email/email.module.js';
import { PersonenInfoController } from '../personandpersoneninfo/personeninfo/personeninfo.controller.js';
import { PersonInfoController } from '../personandpersoneninfo/personinfo/person-info.controller.js';
import { PersonenInfoService } from '../personandpersoneninfo/personeninfo/personeninfo.service.js';
import { PersonModule } from '../person/person.module.js';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';

@Module({
    imports: [
        PersonModule,
        EmailModule,
        RolleModule,
        OrganisationModule,
        PersonenKontextModule,
        KeycloakAdministrationModule,
        LoggerModule.register(PersonAndPersoneninfoModule.name),
    ],
    providers: [PersonenInfoService],
    controllers: [PersonInfoController, PersonenInfoController],
})
export class PersonAndPersoneninfoModule {}
