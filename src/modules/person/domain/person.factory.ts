import { Injectable } from '@nestjs/common';
import { UsernameGeneratorService } from './username-generator.service.js';
import { Person } from './person.js';
import { PersonCreationParams } from './person.creation.params.js';

@Injectable()
export class PersonFactory {
    public constructor(private usernameGenerator: UsernameGeneratorService) {}

    public async createNew(creationParams: PersonCreationParams): Promise<Person<false>> {
        return Person.createNew(this.usernameGenerator, creationParams);
    }
}
