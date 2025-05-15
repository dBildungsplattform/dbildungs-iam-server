/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { PersonRepository } from '../persistence/person.repository.js';
import { PersonLandesbediensteterSearchResponse } from '../api/person-landesbediensteter-search.response.js';

@Injectable()
export class PersonLandesbediensteterSearchService {
    public constructor(
        private readonly logger: ClassLogger,
        private personRepository: PersonRepository,
    ) {}

    public findLandesbediensteter(
        personalnummer?: string,
        primaryEmailAddress?: string,
        username?: string,
        fullname?: string,
    ): PersonLandesbediensteterSearchResponse {
        return new PersonLandesbediensteterSearchResponse('x', 'x', 'x', 'x', 'x', []);
    }
}
