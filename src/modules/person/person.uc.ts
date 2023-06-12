import { Injectable } from '@nestjs/common';
import { CreatePersonDto } from './dto/index.js';
import { PersonService } from './person.service.js';
import { PersonDo } from './person.do.js';

@Injectable()
export class PersonUc {
    public constructor(private readonly personService: PersonService) {}

    public async createPerson(person: CreatePersonDto): Promise<PersonDo> {
        const result = await this.personService.createPerson(person);
        if (result.ok) {
            return result.value;
        }
        throw result.error;
    }
}
