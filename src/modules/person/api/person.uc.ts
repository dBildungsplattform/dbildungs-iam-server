import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../shared/error/domain.error.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { SchulConnexError } from '../../../shared/error/schul-connex.error.js';
import { KeycloakUserService } from '../../keycloak-administration/index.js';
import { PersonDo } from '../domain/person.do.js';
import { PersonService } from '../domain/person.service.js';
import { CreatePersonDto } from './create-person.dto.js';
import { PersonDto } from './person.dto.js';
import { PersonendatensatzDto } from './personendatensatz.dto.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { EntityNotFoundError, KeycloakClientError } from '../../../shared/error/index.js';
import { UpdatePersonDto } from './update-person.dto.js';
import { HttpStatusCode } from 'axios';
import { Person } from '../domain/person.js';
import { UsernameGeneratorService } from '../domain/username-generator.service.js';
import { PersonRepository } from '../persistence/person.repository.js';

@Injectable()
export class PersonUc {
    public constructor(
        private readonly personService: PersonService,
        private readonly personRepository: PersonRepository,
        private readonly usernameGenerator: UsernameGeneratorService,
        private readonly userService: KeycloakUserService,
        private readonly logger: ClassLogger,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    public async createPerson(personDto: CreatePersonDto): Promise<PersonDto | SchulConnexError> {
        if (!personDto.vorname) {
            return new SchulConnexError({
                titel: 'Anfrage unvollständig',
                code: HttpStatusCode.BadRequest,
                subcode: '00',
                beschreibung: 'Vorname nicht angegeben, wird für die Erzeugung des Benutzernamens gebraucht',
            });
        }
        if (!personDto.familienname) {
            return new SchulConnexError({
                titel: 'Anfrage unvollständig',
                code: HttpStatusCode.BadRequest,
                subcode: '00',
                beschreibung: 'Nachname nicht angegeben, wird für die Erzeugung des Benutzernamens gebraucht',
            });
        }

        const person: Person<false> = Person.createNew(personDto.familienname, personDto.vorname);
        try {
            await person.saveUser(this.userService, this.usernameGenerator);
            if (person.keycloakUserId === undefined) {
                throw new KeycloakClientError(`Can't save user`);
            }
        } catch (error) {
            return SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(new KeycloakClientError(`Can't save user`));
        }

        // create person
        const personDo: PersonDo<false> = this.mapper.map(personDto, CreatePersonDto, PersonDo);
        personDo.keycloakUserId = person.keycloakUserId;
        personDo.referrer = person.username;
        personDo.mandant = person.mandant;

        const result: Result<PersonDo<true>, DomainError> = await this.personService.createPerson(personDo);
        if (result.ok) {
            const resPersonDto: PersonDto = this.mapper.map(personDo, PersonDo, PersonDto);
            resPersonDto.startpasswort = person.newPassword;
            return resPersonDto;
        }

        // delete user if person could not be created
        const deleteUserResult: Result<void, DomainError> = await this.userService.delete(person.keycloakUserId);
        if (deleteUserResult.ok) {
            return SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(result.error);
        } else {
            return SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(deleteUserResult.error);
        }
    }

    public async resetPassword(personId: string): Promise<Result<string> | SchulConnexError> {
        try {
            const personResult: { ok: true; value: PersonDo<true> } | { ok: false; error: DomainError } =
                await this.personService.findPersonById(personId);
            if (!personResult.ok) {
                return SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(personResult.error);
            }
            const person: Option<Person<true>> = await this.personRepository.findByKeycloakUserId(
                personResult.value.keycloakUserId,
            );
            if (!person) {
                return SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new EntityNotFoundError('Person', personResult.value.id),
                );
            }

            person.resetPassword();
            await person.saveUser(this.userService, this.usernameGenerator);
            return { ok: true, value: person.newPassword };
        } catch (error) {
            this.logger.error(JSON.stringify(error));
            if (error instanceof Error) {
                return { ok: false, error: error };
            } else {
                return { ok: false, error: new Error('Unknown error occurred') };
            }
        }
    }

    public async updatePerson(updateDto: UpdatePersonDto): Promise<PersonendatensatzDto | SchulConnexError> {
        const personDo: PersonDo<true> = this.mapper.map(updateDto, UpdatePersonDto, PersonDo);
        const result: Result<PersonDo<true>, DomainError> = await this.personService.updatePerson(personDo);

        if (!result.ok) {
            return SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(result.error);
        }

        return new PersonendatensatzDto({
            person: this.mapper.map(result.value, PersonDo, PersonDto),
            personenkontexte: [],
        });
    }
}
