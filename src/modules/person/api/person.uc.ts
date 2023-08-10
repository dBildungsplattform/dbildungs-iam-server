import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { CreatePersonDto } from '../domain/create-person.dto.js';
import { PersonService } from '../domain/person.service.js';
import { PersonDo } from '../domain/person.do.js';

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

    public async findPersonById(id: string): Promise<CreatePersonDto> {
        const result: Result<PersonDo<true>> = await this.personService.findPersonById(id);
        if (result.ok) {
            // map to transfer object.
            const personDo: PersonDo<true> = result.value;
            const person: CreatePersonDto = this.mapper.map(personDo, PersonDo, CreatePersonDto);
            return person;
        }
        throw result.error;
    }
}
