import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { PersonenkontextDo } from '../domain/personenkontext.do.js';
import { PersonenkontextService } from '../domain/personenkontext.service.js';
import { CreatePersonenkontextDto } from './create-personenkontext.dto.js';
import { CreatedPersonenkontextDto } from './created-personenkontext.dto.js';

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
}
