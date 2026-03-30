import { Module } from '@nestjs/common';

import { OrganisationModule } from '../organisation/organisation.module.js';
import { PersonLandesbediensteterSearchModule } from '../person/person-landesbedienstete-search/person-landesbediensteter-search.module.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { LandesbediensteterController } from './api/landesbediensteter.controller.js';
import { LandesbediensteterWorkflowFactory } from './domain/landesbediensteter-workflow.factory.js';
import { PersonModule } from '../person/person.module.js';
import { EscalatedPersonPermissionsFactory } from '../authentication/domain/escalated-person-permissions.factory.js';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { AuthenticationModule } from '../authentication/authentication.module.js';

@Module({
    imports: [
        LoggerModule.register(AuthenticationModule.name),
        PersonLandesbediensteterSearchModule,
        PersonModule,
        OrganisationModule,
        PersonenKontextModule,
        RolleModule,
    ],
    providers: [LandesbediensteterWorkflowFactory, EscalatedPersonPermissionsFactory],
    controllers: [LandesbediensteterController],
})
export class LandesbediensteterModule {}
