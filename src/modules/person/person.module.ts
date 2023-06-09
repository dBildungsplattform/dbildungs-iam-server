import { Module } from '@nestjs/common';
import { PersonRepo } from './person.repo.js';
import { PersonService } from './person.service.js';
import { PersonMapperProfile } from './person.mapper.profile.js';

@Module({
    providers: [PersonMapperProfile, PersonRepo, PersonService],
    exports: [PersonMapperProfile, PersonService],
})
export class PersonModule {}
