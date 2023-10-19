import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../shared/error/domain.error.js';
import { PersonenkontextDo } from '../domain/personenkontext.do.js';
import { PersonenkontextService } from '../domain/personenkontext.service.js';
import { CreatePersonenkontextDto } from './create-personenkontext.dto.js';
import { CreatedPersonenkontextDto } from './created-personenkontext.dto.js';
import { FindPersonenkontextDto } from './find-personenkontext.dto.js';
import { PersonenkontextResponse } from './personenkontext.response.js';
import { PersonenkontextDetailedResponse } from './personenkontext-detailed.response.js';

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

    // TODO refactor after EW-561 is done
    public async findAll(findePersonenkontextDto: FindPersonenkontextDto): Promise<PersonenkontextResponse[]> {
        const personenkontextDo: PersonenkontextDo<false> = this.mapper.map(
            findePersonenkontextDto,
            FindPersonenkontextDto,
            PersonenkontextDo,
        );
        const result: Result<PersonenkontextDo<true>[], DomainError> =
            await this.personenkontextService.findAllPersonenkontexte(personenkontextDo);

        if (!result.ok) {
            throw result.error;
        }

        const personenkontexte: PersonenkontextResponse[] = result.value.map(
            (personenkontext: PersonenkontextDo<true>) =>
                this.mapper.map(personenkontext, PersonenkontextDo, PersonenkontextResponse),
        );
        return personenkontexte;
    }

    public async findById(id: string): Promise<PersonenkontextDetailedResponse> {
        const result: Result<PersonenkontextDo<true>> = await this.personenkontextService.findById(id);

        if (!result.ok) {
            throw result.error;
        }

        return this.mapper.map(result.value, PersonenkontextDo, PersonenkontextDetailedResponse);
    }
}
