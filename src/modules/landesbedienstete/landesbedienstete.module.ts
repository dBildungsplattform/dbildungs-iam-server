import { Module } from '@nestjs/common';

import { OrganisationModule } from '../organisation/organisation.module.js';
import { PersonLandesbediensteterSearchModule } from '../person/person-landesbedienstete-search/person-landesbediensteter-search.module.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { LandesbediensteteController } from './api/landesbedienstete.controller.js';
import { LandesbediensteteWorkflowFactory } from './domain/landesbedienstete-workflow.factory.js';
import { PersonModule } from '../person/person.module.js';

@Module({
    imports: [
        PersonLandesbediensteterSearchModule,
        PersonModule,
        OrganisationModule,
        PersonenKontextModule,
        RolleModule,
    ],
    providers: [LandesbediensteteWorkflowFactory],
    controllers: [LandesbediensteteController],
})
export class LandesbediensteteModule {}
