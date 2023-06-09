import { Mapper } from '@automapper/core';
import { Body, Controller, Inject, Post } from '@nestjs/common';
import { MapPipe, getMapperToken } from '@automapper/nestjs';
import { CreatePersonBodyParams, CreatePersonDTO, CreatePersonResponse, PersonDO } from './dto/index.js';
import { PersonDO } from './person.do.js';
import { PersonUc } from './person.uc.js';

@Controller({ path: 'person' })
export class PersonController {
    public constructor(private readonly uc: PersonUc, @Inject(getMapperToken()) private readonly mapper: Mapper) {}

    @Post()
    public async createPerson(
        @Body(MapPipe(CreatePersonBodyParams, CreatePersonDTO)) person: CreatePersonDTO,
    ): Promise<CreatePersonResponse> {
        const response = this.mapper.map(await this.uc.createPerson(person), PersonDO, CreatePersonResponse);
        return response;
    }
}
