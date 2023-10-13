import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { KeycloakUserService, UserDo } from '../../keycloak-administration/index.js';
import { CreatePersonDto } from '../domain/create-person.dto.js';
import { PersonService } from '../domain/person.service.js';
import { PersonDo } from '../domain/person.do.js';
import { FindPersonendatensatzDto } from './find-personendatensatz.dto.js';
import { PersonendatensatzResponse } from './personendatensatz.response.js';
import { PersonenkontextService } from '../domain/personenkontext.service.js';
import { SichtfreigabeType } from './personen-query.param.js';
import { FindPersonenkontextDto } from './find-personenkontext.dto.js';
import { PersonenkontextDo } from '../domain/personenkontext.do.js';
import { PersonenkontextResponse } from './personenkontext.response.js';
import { DomainError } from '../../../shared/error/domain.error.js';

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

    public async findPersonById(id: string): Promise<PersonendatensatzResponse> {
        const result: Result<PersonDo<true>> = await this.personService.findPersonById(id);
        if (result.ok) {
            const person: PersonendatensatzResponse = this.mapper.map(
                result.value,
                PersonDo,
                PersonendatensatzResponse,
            );
            person.personenkontexte = await this.findPersonenkontexteForPerson(id, SichtfreigabeType.NEIN);

            return person;
        }
        throw result.error;
    }

    public async findAll(personDto: FindPersonendatensatzDto): Promise<PersonendatensatzResponse[]> {
        const personDo: PersonDo<false> = this.mapper.map(personDto, FindPersonendatensatzDto, PersonDo);
        const result: PersonDo<true>[] = await this.personService.findAllPersons(personDo);
        if (result.length === 0) {
            return [];
        }
        const persons: PersonendatensatzResponse[] = result.map((person: PersonDo<true>) =>
            this.mapper.map(person, PersonDo, PersonendatensatzResponse),
        );

        for (const person of persons) {
            person.personenkontexte = await this.findPersonenkontexteForPerson(
                person.person.id,
                personDto.sichtfreigabe,
            );
        }
        return persons;
    }

    private async findPersonenkontexteForPerson(
        personId: string,
        sichtfreigabe: SichtfreigabeType,
    ): Promise<PersonenkontextResponse[]> {
        const personenkontextFilter: FindPersonenkontextDto = {
            personId: personId,
            sichtfreigabe: sichtfreigabe,
        };

        const result: Result<PersonenkontextDo<true>[], DomainError> =
            await this.personenkontextService.findAllPersonenkontexte(
                this.mapper.map(personenkontextFilter, FindPersonenkontextDto, PersonenkontextDo),
            );

        if (!result.ok) {
            return [];
        }

        const personenkontextResponses: PersonenkontextResponse[] = result.value.map(
            (personenkontext: PersonenkontextDo<true>) =>
                this.mapper.map(personenkontext, PersonenkontextDo, PersonenkontextResponse),
        );
        return personenkontextResponses;
    }
}
