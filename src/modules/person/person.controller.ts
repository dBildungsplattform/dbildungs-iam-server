import { Mapper } from '@automapper/core';
import { Body, Controller, Inject, Post } from '@nestjs/common';
import { MapPipe, getMapperToken } from '@automapper/nestjs';
import { CreatePersonBodyParams, CreatePersonDto, CreatePersonResponse } from './dto/index.js';
import { PersonDo } from './person.do.js';
import { PersonUc } from './person.uc.js';

@Controller({ path: 'person' })
export class PersonController {
    public constructor(private readonly uc: PersonUc, @Inject(getMapperToken()) private readonly mapper: Mapper) {}

    @Post()
    public async createPerson(
        @Body(MapPipe(CreatePersonBodyParams, CreatePersonDto)) person: CreatePersonDto,
    ): Promise<CreatePersonResponse> {
        const response = this.mapper.map(await this.uc.createPerson(person), PersonDo, CreatePersonResponse);
        return response;
    }
}
