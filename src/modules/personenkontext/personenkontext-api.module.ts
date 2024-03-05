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
import { DBiamPersonenkontextRepo } from './dbiam/dbiam-personenkontext.repo.js';
import { DBiamPersonenkontextController } from './dbiam/dbiam-personenkontext.controller.js';

@Module({
    imports: [PersonModule, RolleModule, OrganisationModule, LoggerModule.register(PersonenKontextApiModule.name)],
    providers: [PersonenkontextUc, PersonenkontextService, PersonenkontextRepo, PersonRepo, DBiamPersonenkontextRepo],
    controllers: [PersonenkontextController, DBiamPersonenkontextController],
})
export class PersonenKontextApiModule {}
