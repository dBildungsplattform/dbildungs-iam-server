import { Injectable } from '@nestjs/common';
import { UsernameGeneratorService } from './username-generator.service.js';
import { Person, PersonCreationParams } from './person.js';
import { DomainError } from '../../../shared/error/domain.error.js';

@Injectable()
export class PersonFactory {
    public constructor(private usernameGenerator: UsernameGeneratorService) {}

    public async createNew(creationParams: PersonCreationParams): Promise<Person<false> | DomainError> {
        return Person.createNew(this.usernameGenerator, creationParams);
    }
}
