import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { PersonenkontextUc } from '../personenkontext/api/personenkontext.uc.js';
import { PersonenkontextController } from '../personenkontext/api/personenkontext.controller.js';
import { PersonModule } from '../person/person.module.js';
import { PersonenkontextService } from './domain/personenkontext.service.js';
import { PersonenkontextRepo } from './persistence/personenkontext.repo.js';
import { PersonRepo } from '../person/persistence/person.repo.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { OrganisationModule } from '../organisation/organisation.module.js';
import { DBiamPersonenkontextRepo } from './persistence/dbiam-personenkontext.repo.js';
import { DBiamPersonenkontextController } from './api/dbiam-personenkontext.controller.js';
import { DbiamPersonenkontextFilterController } from './api/dbiam-personenkontext-workflow.controller.js';
import { PersonenkontextWorkflowFactory } from './domain/personenkontext-workflow.factory.js';
import { DBiamPersonenkontextService } from './domain/dbiam-personenkontext.service.js';
import { DbiamPersonenkontextFactory } from './domain/dbiam-personenkontext.factory.js';
import { EventModule } from '../../core/eventbus/index.js';
import { PersonenkontextFactory } from './domain/personenkontext.factory.js';

@Module({
    imports: [
        EventModule,
        PersonModule,
        RolleModule,
        OrganisationModule,
        LoggerModule.register(PersonenKontextApiModule.name),
    ],
    providers: [
        PersonenkontextUc,
        PersonenkontextService,
        DBiamPersonenkontextService,
        PersonenkontextRepo,
        PersonRepo,
        DBiamPersonenkontextRepo,
        PersonenkontextWorkflowFactory,
        DbiamPersonenkontextFactory,
        PersonenkontextFactory,
    ],
    controllers: [PersonenkontextController, DBiamPersonenkontextController, DbiamPersonenkontextFilterController],
})
export class PersonenKontextApiModule {}
