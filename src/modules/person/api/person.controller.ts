import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { PersonUc } from '../api/person.uc.js';
import { CreatePersonResponse } from './create-person.response.js';
import { CreatePersonBodyParams } from './create-person.body.params.js';
import { CreatePersonDto } from '../domain/create-person.dto.js';

@ApiTags('person')
@Controller({ path: 'person' })
export class PersonController {
    public constructor(private readonly uc: PersonUc, @Inject(getMapperToken()) private readonly mapper: Mapper) {}

    // TODO: add swagger annotations
    @Post()
    @ApiCreatedResponse({ description: 'The person was successfully created.', type: CreatePersonResponse })
    public async createPerson(@Body() params: CreatePersonBodyParams): Promise<CreatePersonResponse> {
        const dto: CreatePersonDto = this.mapper.map(params, CreatePersonBodyParams, CreatePersonDto);
        const response: CreatePersonResponse = await this.uc.createPerson(dto);
        return response;
    }
}
