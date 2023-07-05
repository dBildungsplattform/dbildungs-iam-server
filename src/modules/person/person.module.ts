import { Module } from '@nestjs/common';
import { PersonService } from './domain/person.service.js';
import { PersonPersistenceMapperProfile } from './persistence/person-persistence.mapper.profile.js';
import { PersonRepo } from './persistence/person.repo.js';

@Module({
    providers: [PersonPersistenceMapperProfile, PersonRepo, PersonService],
    exports: [PersonService],
})
export class PersonModule {}
