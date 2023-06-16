import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Body, Controller, Inject, Post } from '@nestjs/common';
import { CreatePersonBodyParams, CreatePersonDto, CreatePersonResponse } from './dto/index.js';
import { PersonDo } from './person.do.js';
import { PersonUc } from './person.uc.js';

@Controller({ path: 'person' })
export class PersonController {
    public constructor(private readonly uc: PersonUc, @Inject(getMapperToken()) private readonly mapper: Mapper) {}

    // TODO: add swagger annotations
    @Post()
    public async createPerson(@Body() params: CreatePersonBodyParams): Promise<CreatePersonResponse> {
        const dto = this.mapper.map(params, CreatePersonBodyParams, CreatePersonDto);
        const response = this.mapper.map(await this.uc.createPerson(dto), PersonDo, CreatePersonResponse);
        return response;
    }
}
