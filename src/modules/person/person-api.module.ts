import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';

import { PersonController } from './api/person.controller.js';
import { PersonModule } from './person.module.js';
import { PersonFrontendController } from './api/person.frontend.controller.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { OrganisationModule } from '../organisation/organisation.module.js';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';
import { DBiamPersonenuebersichtController } from './api/personenuebersicht/dbiam-personenuebersicht.controller.js';
import { PersonApiMapper } from './mapper/person-api.mapper.js';
import { PersonDeleteModule } from './person-deletion/person-delete.module.js';
import { EmailModule } from '../email/email.module.js';
import { LdapModule } from '../../core/ldap/ldap.module.js';
import { PersonLandesbediensteterSearchModule } from './person-landesbedienstete-search/person-landesbediensteter-search.module.js';
import { PersonenInfoController } from './api/personandpersoneninfo/personeninfo/personeninfo.controller.js';
import { PersonInfoController } from './api/personandpersoneninfo/personinfo/person-info.controller.js';
import { PersonenInfoService } from './api/personandpersoneninfo/personeninfo/personeninfo.service.js';

@Module({
    imports: [
        PersonModule,
        LdapModule,
        EmailModule,
        RolleModule,
        OrganisationModule,
        PersonenKontextModule,
        PersonDeleteModule,
        PersonLandesbediensteterSearchModule,
        KeycloakAdministrationModule,
        LoggerModule.register(PersonApiModule.name),
    ],
    providers: [PersonApiMapper, PersonenInfoService],
    controllers: [
        PersonController,
        PersonFrontendController,
        DBiamPersonenuebersichtController,
        PersonInfoController,
        PersonenInfoController,
    ],
})
export class PersonApiModule {}
