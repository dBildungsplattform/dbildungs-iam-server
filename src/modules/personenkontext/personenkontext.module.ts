import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { PersonenkontextRepo } from '../personenkontext/persistence/personenkontext.repo.js';
import { PersonenkontextService } from '../personenkontext/domain/personenkontext.service.js';
import { PersonModule } from '../person/person.module.js';
import { PersonRepo } from '../person/persistence/person.repo.js';
import { DBiamPersonenkontextRepo } from './persistence/dbiam-personenkontext.repo.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { OrganisationModule } from '../organisation/organisation.module.js';
import { DBiamPersonenkontextService } from './domain/dbiam-personenkontext.service.js';
import { DbiamPersonenkontextFactory } from './domain/dbiam-personenkontext.factory.js';
import { PersonenkontextFactory } from './domain/personenkontext.factory.js';
import {EventService} from "../../core/eventbus/index.js";

@Module({
    imports: [PersonModule, RolleModule, OrganisationModule, LoggerModule.register(PersonenKontextModule.name)],
    providers: [
        PersonenkontextRepo,
        PersonenkontextService,
        PersonRepo,
        DBiamPersonenkontextService,
        DBiamPersonenkontextRepo,
        DbiamPersonenkontextFactory,
        PersonenkontextFactory,
        EventService,
    ],
    exports: [
        PersonenkontextService,
        PersonenkontextRepo,
        DBiamPersonenkontextService,
        DBiamPersonenkontextRepo,
        DbiamPersonenkontextFactory,
        PersonenkontextFactory,
    ],
})
export class PersonenKontextModule {}
