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
import { DbiamPersonenkontextFilterController } from './api/dbiam-personenkontext-filter.controller.js';
import { PersonenkontextAnlageFactory } from './domain/personenkontext-anlage.factory.js';
import { DBiamPersonenkontextService } from './domain/dbiam-personenkontext.service.js';

@Module({
    imports: [PersonModule, RolleModule, OrganisationModule, LoggerModule.register(PersonenKontextApiModule.name)],
    providers: [
        PersonenkontextUc,
        PersonenkontextService,
        DBiamPersonenkontextService,
        PersonenkontextRepo,
        PersonRepo,
        DBiamPersonenkontextRepo,
        PersonenkontextAnlageFactory,
    ],
    controllers: [PersonenkontextController, DBiamPersonenkontextController, DbiamPersonenkontextFilterController],
})
export class PersonenKontextApiModule {}
