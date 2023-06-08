import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { CreatePersonDTO, PersonDO } from './dto/index.js';
import { PersonRepo } from './person.repo.js';
import { PersonEntity } from './person.entity.js';
import { DomainError, PersonAlreadyExistsError } from '../../shared/index.js';

@Injectable()
export class PersonService {
    public constructor(
        private readonly personRepo: PersonRepo,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    public async createPerson(person: CreatePersonDTO): Promise<Result<PersonDO, DomainError>> {
        const newPerson = this.mapper.map(person, CreatePersonDTO, PersonEntity);
        const personName = ''; // TODO: set name
        const foundPerson = await this.personRepo.findByName(personName);
        if (foundPerson) {
            return { ok: false, error: new PersonAlreadyExistsError(personName) };
        }
        await this.personRepo.save(newPerson);
        return { ok: true, value: this.mapper.map(newPerson, PersonEntity, PersonDO) };
    }
}
