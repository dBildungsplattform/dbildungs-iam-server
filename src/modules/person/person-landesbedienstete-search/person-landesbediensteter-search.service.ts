/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { PersonRepository } from '../persistence/person.repository.js';
import { PersonLandesbediensteterSearchResponse } from '../api/person-landesbediensteter-search.response.js';
import { Person } from '../domain/person.js';

@Injectable()
export class PersonLandesbediensteterSearchService {
    public constructor(private personRepository: PersonRepository) {}

    public async findLandesbediensteter(
        personalnummer?: string,
        primaryEmailAddress?: string,
        username?: string,
        fullname?: string,
    ): Promise<PersonLandesbediensteterSearchResponse> {
        const definedParams: boolean[] = [
            personalnummer !== undefined,
            primaryEmailAddress !== undefined,
            username !== undefined,
            fullname !== undefined,
        ].filter(Boolean);

        if (definedParams.length !== 1) {
            throw new Error('Exactly one search parameter must be defined');
        }

        let persons: Person<true>[] = [];

        if (personalnummer) {
            persons = await this.personRepository.findByPersonalnummer(personalnummer);
        } else if (primaryEmailAddress) {
            persons = await this.personRepository.findByPrimaryEmailAddress(primaryEmailAddress);
        } else if (username) {
            persons = await this.personRepository.findByUsername(username);
        } else if (fullname) {
            const [vorname, ...rest]: string[] = fullname.trim().split(/\s+/);
            if (!vorname || rest.length === 0) {
                throw new Error('Fullname must include both first and last name');
            }
            const familienname: string = rest.join(' ');
            persons = await this.personRepository.findByFullName(vorname, familienname);
        }

        if (persons.length === 0) {
            throw new Error('No person found for given search criteria');
        }
        if (persons.length > 1) {
            throw new Error('Multiple persons found for given search criteria');
        }

        const person: Person<true> = persons.at(0)!;

        return new PersonLandesbediensteterSearchResponse(person.vorname, person.familienname, 'x', 'x', 'x', []);
    }
}
