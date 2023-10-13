import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { KeycloakUserService, UserDo } from '../../keycloak-administration/index.js';
import { CreatePersonDto } from '../domain/create-person.dto.js';
import { PersonService } from '../domain/person.service.js';
import { PersonDo } from '../domain/person.do.js';
import { FindPersonDatensatzDTO } from './finde-persondatensatz-dto.js';
import { PersonenDatensatz } from './personendatensatz.js';
import { PersonenkontextService } from '../domain/personenkontext.service.js';
import { SichtfreigabeType } from './personen-query.param.js';
import { FindePersonenkontextDto } from './finde-personenkontext.dto.js';
import { PersonenkontextDo } from '../domain/personenkontext.do.js';
import { PersonenkontextResponse } from './personenkontext.response.js';

@Injectable()
export class PersonUc {
    public constructor(
        private readonly personService: PersonService,
        private readonly personenkontextService: PersonenkontextService,
        private readonly userService: KeycloakUserService,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    public async createPerson(personDto: CreatePersonDto): Promise<void> {
        // create user
        const userDo: UserDo<false> = this.mapper.map(personDto, CreatePersonDto, UserDo<false>);
        const userIdResult: Result<string> = await this.userService.create(userDo);
        if (!userIdResult.ok) {
            throw userIdResult.error;
        }

        // create person
        const personDo: PersonDo<false> = this.mapper.map(personDto, CreatePersonDto, PersonDo);
        personDo.keycloakUserId = userIdResult.value;

        const result: Result<PersonDo<true>> = await this.personService.createPerson(personDo);
        if (result.ok) {
            return;
        }

        // delete user if person could not be created
        const deleteUserResult: Result<void> = await this.userService.delete(userIdResult.value);
        if (deleteUserResult.ok) {
            throw result.error;
        } else {
            throw deleteUserResult.error;
        }
    }

    public async findPersonById(id: string): Promise<PersonenDatensatz> {
        const result: Result<PersonDo<true>> = await this.personService.findPersonById(id);
        if (result.ok) {
            const person: PersonenDatensatz = this.mapper.map(result.value, PersonDo, PersonenDatensatz);
            person.personenkontexte = await this.findPersonenkontexteForPerson(id, SichtfreigabeType.NEIN);

            return person;
        }
        throw result.error;
    }

    public async findAll(personDto: FindPersonDatensatzDTO): Promise<PersonenDatensatz[]> {
        const personDo: PersonDo<false> = this.mapper.map(personDto, FindPersonDatensatzDTO, PersonDo);
        const result: PersonDo<true>[] = await this.personService.findAllPersons(personDo);
        if (result.length !== 0) {
            const persons: PersonenDatensatz[] = result.map((person: PersonDo<true>) =>
                this.mapper.map(person, PersonDo, PersonenDatensatz),
            );

            for (const person of persons) {
                person.personenkontexte = await this.findPersonenkontexteForPerson(
                    person.person.id,
                    personDto.sichtfreigabe,
                );
            }
            return persons;
        }
        return [];
    }

    private async findPersonenkontexteForPerson(
        personId: string,
        sichtfreigabe: SichtfreigabeType,
    ): Promise<PersonenkontextResponse[]> {
        const personenkontextFilter: FindePersonenkontextDto = {
            personId: personId,
            sichtfreigabe: sichtfreigabe,
        };

        const personenkontexte: PersonenkontextDo<true>[] = await this.personenkontextService.findAllPersonenkontexte(
            this.mapper.map(personenkontextFilter, FindePersonenkontextDto, PersonenkontextDo),
        );

        const personenkontextResponses: PersonenkontextResponse[] = personenkontexte.map(
            (personenkontext: PersonenkontextDo<true>) =>
                this.mapper.map(personenkontext, PersonenkontextDo, PersonenkontextResponse),
        );
        return personenkontextResponses;
    }
}
