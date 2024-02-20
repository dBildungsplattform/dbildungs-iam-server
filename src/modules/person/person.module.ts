import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { PersonService } from './domain/person.service.js';
import { PersonPersistenceMapperProfile } from './persistence/person-persistence.mapper.profile.js';
import { PersonRepo } from './persistence/person.repo.js';

@Module({
    imports: [LoggerModule.register(PersonModule.name)],
    providers: [PersonPersistenceMapperProfile, PersonRepo, PersonService],
    exports: [PersonService],
})
export class PersonModule {}
