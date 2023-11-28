import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { Paged } from '../../../shared/paging/index.js';
import { KeycloakUserService } from '../../keycloak-administration/index.js';
import { PersonDo } from '../domain/person.do.js';
import { PersonService } from '../domain/person.service.js';
import { PersonenkontextDo } from '../domain/personenkontext.do.js';
import { SichtfreigabeType } from '../domain/personenkontext.enums.js';
import { PersonenkontextService } from '../domain/personenkontext.service.js';
import { CreatePersonDto } from './create-person.dto.js';
import { FindPersonendatensatzDto } from './find-personendatensatz.dto.js';
import { FindPersonenkontextDto } from './find-personenkontext.dto.js';
import { PersonDto } from './person.dto.js';
import { PersonendatensatzDto } from './personendatensatz.dto.js';
import { PersonenkontextDto } from './personenkontext.dto.js';
import { UserRepository } from '../../user/user.repository.js';
import { User } from '../../user/user.js';

@Injectable()
export class PersonUc {
    public constructor(
        private readonly personService: PersonService,
        private readonly personenkontextService: PersonenkontextService,
        private readonly userService: KeycloakUserService,
        private readonly userRepository: UserRepository,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    public async createPerson(personDto: CreatePersonDto): Promise<PersonDto> {
        if (!personDto.vorname) {
            throw new Error('First name not given, needed for username generation');
        }
        if (!personDto.familienname) {
            throw new Error('Fast name not given needed for username generation');
        }
        // create user
        const user: User = await this.userRepository.createUser(personDto.vorname, personDto.familienname);
        await user.save(this.userService);

        // create person
        const personDo: PersonDo<false> = this.mapper.map(personDto, CreatePersonDto, PersonDo);
        personDo.keycloakUserId = user.id;
        personDo.referrer = user.username;

        const result: Result<PersonDo<true>> = await this.personService.createPerson(personDo);
        if (result.ok) {
            const resPersonDto: PersonDto = this.mapper.map(personDo, PersonDo, PersonDto);
            resPersonDto.startpasswort = user.newPassword;
            return resPersonDto;
        }

        // delete user if person could not be created
        const deleteUserResult: Result<void> = await this.userService.delete(user.id);
        if (deleteUserResult.ok) {
            throw result.error;
        } else {
            throw deleteUserResult.error;
        }
    }

    public async findPersonById(id: string): Promise<PersonendatensatzDto> {
        const result: Result<PersonDo<true>> = await this.personService.findPersonById(id);

        if (!result.ok) {
            throw result.error;
        }

        const personDto: PersonDto = this.mapper.map(result.value, PersonDo, PersonDto);
        const personenkontexteDto: PersonenkontextDto[] = await this.findPersonenkontexteForPerson(
            id,
            SichtfreigabeType.NEIN,
        );

        return new PersonendatensatzDto({
            person: personDto,
            personenkontexte: personenkontexteDto,
        });
    }

    public async findAll(personDto: FindPersonendatensatzDto): Promise<Paged<PersonendatensatzDto>> {
        const personDo: PersonDo<false> = this.mapper.map(personDto, FindPersonendatensatzDto, PersonDo);
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

        const personDtos: PersonDto[] = result.items.map((person: PersonDo<true>) =>
            this.mapper.map(person, PersonDo, PersonDto),
        );
        const personendatensatzDtos: PersonendatensatzDto[] = [];

        for (const person of personDtos) {
            const personenkontextDtos: PersonenkontextDto[] = await this.findPersonenkontexteForPerson(
                person.id,
                personDto.sichtfreigabe,
            );

            personendatensatzDtos.push(
                new PersonendatensatzDto({
                    person,
                    personenkontexte: personenkontextDtos,
                }),
            );
        }

        return {
            total: result.total,
            offset: result.offset,
            limit: result.limit,
            items: personendatensatzDtos,
        };
    }

    public async resetPassword(personId: string): Promise<Result<string>> {
        return this.userService.resetPasswordByPersonId(personId);
    }

    private async findPersonenkontexteForPerson(
        personId: string,
        sichtfreigabe: SichtfreigabeType,
    ): Promise<PersonenkontextDto[]> {
        const personenkontextFilter: FindPersonenkontextDto = {
            personId: personId,
            sichtfreigabe: sichtfreigabe,
        };

        const result: Paged<PersonenkontextDo<true>> = await this.personenkontextService.findAllPersonenkontexte(
            this.mapper.map(personenkontextFilter, FindPersonenkontextDto, PersonenkontextDo),
        );

        const personenkontextDtos: PersonenkontextDto[] = this.mapper.mapArray(
            result.items,
            PersonenkontextDo,
            PersonenkontextDto,
        );

        return personenkontextDtos;
    }
}
