import { Module } from '@nestjs/common';
import { PersonService } from './domain/person.service.js';
import { PersonRepo } from './persistence/person.repo.js';
import { PersonMapperProfile } from './person.mapper.profile.js';

@Module({
    providers: [PersonMapperProfile, PersonRepo, PersonService],
    exports: [PersonMapperProfile, PersonService],
})
export class PersonModule {}
