import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { PersonenkontextDo } from '../domain/personenkontext.do.js';
import { PersonenkontextService } from '../domain/personenkontext.service.js';
import { CreatePersonenkontextDto } from './create-personenkontext.dto.js';
import { CreatedPersonenkontextDto } from './created-personenkontext.dto.js';
import { FindePersonenkontextDto } from './finde-personenkontext.dto.js';
import { PersonenkontextResponse } from './personenkontext.response.js';

@Injectable()
export class PersonenkontextUc {
    public constructor(
        private readonly personenkontextService: PersonenkontextService,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    public async createPersonenkontext(
        personenkontextDto: CreatePersonenkontextDto,
    ): Promise<CreatedPersonenkontextDto> {
        const personenkontextDo: PersonenkontextDo<false> = this.mapper.map(
            personenkontextDto,
            CreatePersonenkontextDto,
            PersonenkontextDo,
        );
        const result: Result<PersonenkontextDo<true>> = await this.personenkontextService.createPersonenkontext(
            personenkontextDo,
        );
        if (result.ok) {
            return this.mapper.map(result.value, PersonenkontextDo, CreatedPersonenkontextDto);
        }
        throw result.error;
    }

    public async findAll(findePersonenkontextDto: FindePersonenkontextDto): Promise<PersonenkontextResponse[]> {
        const personenkontextDo: PersonenkontextDo<false> = this.mapper.map(
            findePersonenkontextDto,
            FindePersonenkontextDto,
            PersonenkontextDo,
        );
        const result: PersonenkontextDo<true>[] = await this.personenkontextService.findAllPersonenkontexte(
            personenkontextDo,
        );
        if (result.length !== 0) {
            const personenkontexte: PersonenkontextResponse[] = result.map((personenkontext: PersonenkontextDo<true>) =>
                this.mapper.map(personenkontext, PersonenkontextDo, PersonenkontextResponse),
            );
            return personenkontexte;
        }
        return [];
    }
}
