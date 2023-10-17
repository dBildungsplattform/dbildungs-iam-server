import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { KeycloakUserService, UserDo } from '../../keycloak-administration/index.js';
import { CreatePersonDto } from '../domain/create-person.dto.js';
import { PersonService } from '../domain/person.service.js';
import { PersonDo } from '../domain/person.do.js';
import { FindPersonDatensatzDTO as FindPersonDatensatzDto } from './finde-persondatensatz-dto.js';
import { PersonenDatensatz } from './personendatensatz.js';
import { Paged } from '../../../shared/paging/index.js';

@Injectable()
export class PersonUc {
    public constructor(
        private readonly personService: PersonService,
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
            return person;
        }
        throw result.error;
    }

    public async findAll(personDto: FindPersonDatensatzDto): Promise<Paged<PersonenDatensatz>> {
        const personDo: PersonDo<false> = this.mapper.map(personDto, FindPersonDatensatzDto, PersonDo);
        const result: Paged<PersonDo<true>> = await this.personService.findAllPersons(
            personDo,
            personDto.offset,
            personDto.limit,
        );

        if (result.total === 0) {
            return {
                total: result.total,
                offset: result.offset,
                limit: result.limit,
                items: [],
            };
        }

        const persons: PersonenDatensatz[] = result.items.map((person: PersonDo<true>) =>
            this.mapper.map(person, PersonDo, PersonenDatensatz),
        );

        return {
            total: result.total,
            offset: result.offset,
            limit: result.limit,
            items: persons,
        };
    }
}
