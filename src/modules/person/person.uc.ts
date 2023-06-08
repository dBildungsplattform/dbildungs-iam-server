import { Injectable } from '@nestjs/common';
import { PersonService } from './person.service.js';
import { CreatePersonDO, PersonDO } from './dto/index.js';

@Injectable()
export class PersonUc {
    public constructor(private readonly personService: PersonService) {}

    public async createPerson(person: CreatePersonDO): Promise<PersonDO> {
        const result = await this.personService.createPerson(person);
        if (result.ok) {
            return result.value;
        }
        throw result.error;
    }
}
