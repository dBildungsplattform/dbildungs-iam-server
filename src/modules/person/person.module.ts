import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { PersonService } from './domain/person.service.js';
import { PersonPersistenceMapperProfile } from './persistence/person-persistence.mapper.profile.js';
import { PersonRepo } from './persistence/person.repo.js';
import { PersonenkontextRepo } from './persistence/personenkontext.repo.js';
import { PersonenkontextService } from '../person-kontext/domain/personenkontext.service.js';

@Module({
    imports: [LoggerModule.register(PersonModule.name)],
    providers: [PersonPersistenceMapperProfile, PersonRepo, PersonService, PersonenkontextRepo, PersonenkontextService],
    exports: [PersonService, PersonenkontextService],
})
export class PersonModule {}
