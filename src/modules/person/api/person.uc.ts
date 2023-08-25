import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { CreatePersonDto } from '../domain/create-person.dto.js';
import { PersonService } from '../domain/person.service.js';
import { PersonDo } from '../domain/person.do.js';
import { PersonResponse } from './person.response.js';
import { FindPersonDTO } from './find-person.dto.js';

@Injectable()
export class PersonUc {
    public constructor(
        private readonly personService: PersonService,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    public async createPerson(personDto: CreatePersonDto): Promise<void> {
        const personDo: PersonDo<false> = this.mapper.map(personDto, CreatePersonDto, PersonDo);
        const result: Result<PersonDo<true>> = await this.personService.createPerson(personDo);
        if (result.ok) {
            return;
        }
        throw result.error;
    }

    public async findPersonById(id: string): Promise<PersonResponse> {
        const result: Result<PersonDo<true>> = await this.personService.findPersonById(id);
        if (result.ok) {
            const person: PersonResponse = this.mapper.map(result.value, PersonDo, PersonResponse);
            return person;
        }
        throw result.error;
    }

    public async findAll(personDto: FindPersonDTO): Promise<PersonResponse[]> {
        const personDo: PersonDo<false> = this.mapper.map(personDto, FindPersonDTO, PersonDo);
        const result: Option<PersonDo<true>>[] = await this.personService.findAllPersons(personDo);
        const persons: PersonResponse[] = [];
        if (result) {
            result.forEach((person: Option<PersonDo<true>>) => {
                if (person !== null && person !== undefined) {
                    persons.push(this.mapper.map(person, PersonDo, PersonResponse));
                }
            });
        }
        return persons;
    }
}
