import { Injectable } from '@nestjs/common';
import { CreatePersonDTO } from './dto/index.js';
import { PersonService } from './person.service.js';
import { PersonDO } from './person.do.js';

@Injectable()
export class PersonUc {
    public constructor(private readonly personService: PersonService) {}

    public async createPerson(person: CreatePersonDTO): Promise<PersonDO> {
        const result = await this.personService.createPerson(person);
        if (result.ok) {
            return result.value;
        }
        throw result.error;
    }
}
