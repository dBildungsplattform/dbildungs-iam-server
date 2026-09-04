import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { PersonenkontextController } from '../personenkontext/api/personenkontext.controller.js';
import { PersonModule } from '../person/person.module.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { OrganisationModule } from '../organisation/organisation.module.js';
import { DbiamPersonenkontextWorkflowController } from './api/dbiam-personenkontext-workflow.controller.js';
import { EventModule } from '../../core/eventbus/index.js';
import { PersonApiMapper } from '../person/mapper/person-api.mapper.js';
import { PersonenKontextModule } from './personenkontext.module.js';

@Module({
    imports: [
        PersonenKontextModule,
        EventModule,
        PersonModule,
        RolleModule,
        OrganisationModule,
        LoggerModule.register(PersonenKontextApiModule.name),
    ],
    providers: [PersonApiMapper],
    controllers: [PersonenkontextController, DbiamPersonenkontextWorkflowController],
})
export class PersonenKontextApiModule {}
