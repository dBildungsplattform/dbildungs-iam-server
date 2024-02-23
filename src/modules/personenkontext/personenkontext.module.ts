import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { PersonenkontextRepo } from '../personenkontext/persistence/personenkontext.repo.js';
import { PersonenkontextService } from '../personenkontext/domain/personenkontext.service.js';
import { PersonModule } from '../person/person.module.js';
import { PersonRepo } from '../person/persistence/person.repo.js';
import { DBiamPersonenkontextRepo } from './dbiam/dbiam-personenkontext.repo.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { OrganisationModule } from '../organisation/organisation.module.js';

@Module({
    imports: [PersonModule, RolleModule, OrganisationModule, LoggerModule.register(PersonenKontextModule.name)],
    providers: [PersonenkontextRepo, PersonenkontextService, PersonRepo, DBiamPersonenkontextRepo],
    exports: [PersonenkontextService, PersonenkontextRepo],
})
export class PersonenKontextModule {}
