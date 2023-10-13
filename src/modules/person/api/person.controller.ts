import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Body, Controller, Get, Inject, Post, Param, HttpException, HttpStatus, Query, Res } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PersonUc } from '../api/person.uc.js';
import { CreatePersonBodyParams } from './create-person.body.params.js';
import { CreatePersonDto } from '../domain/create-person.dto.js';
import { PersonByIdParams } from './person-by-id.param.js';
import { PersonenQueryParam } from './personen-query.param.js';
import { FindPersonDatensatzDTO } from './finde-persondatensatz-dto.js';
import { PersonenDatensatz } from './personendatensatz.js';
import { Paged, setPaginationHeaders } from '../../../shared/paging/index.js';
import { Response } from 'express';

@ApiTags('person')
@Controller({ path: 'person' })
export class PersonController {
    public constructor(private readonly uc: PersonUc, @Inject(getMapperToken()) private readonly mapper: Mapper) {}

    @Post()
    @ApiCreatedResponse({ description: 'The person was successfully created.' })
    @ApiBadRequestResponse({ description: 'The person already exists.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to create the person.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to create the person.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while creating the person.' })
    public async createPerson(@Body() params: CreatePersonBodyParams): Promise<void> {
        const dto: CreatePersonDto = this.mapper.map(params, CreatePersonBodyParams, CreatePersonDto);
        await this.uc.createPerson(dto);
    }

    @Get(':personId')
    @ApiOkResponse({ description: 'The person was successfully returned.' })
    @ApiBadRequestResponse({ description: 'Person ID is required' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get the person.' })
    @ApiNotFoundResponse({ description: 'The person does not exist.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get the person.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting the person.' })
    public async findPersonById(@Param() params: PersonByIdParams): Promise<PersonenDatensatz | HttpException> {
        try {
            const person: PersonenDatensatz = await this.uc.findPersonById(params.personId);
            return person;
        } catch (error) {
            throw new HttpException('Requested entity does not exist', HttpStatus.NOT_FOUND);
        }
    }

    @Get()
    @ApiOkResponse({ description: 'The persons were successfully returned.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get persons.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get persons.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting all persons.' })
    public async findPersons(
        @Query() queryParams: PersonenQueryParam,
        @Res() res: Response,
    ): Promise<PersonenDatensatz[]> {
        const persondatensatzDTO: FindPersonDatensatzDTO = this.mapper.map(
            queryParams,
            PersonenQueryParam,
            FindPersonDatensatzDTO,
        );
        const persons: Paged<PersonenDatensatz> = await this.uc.findAll(persondatensatzDTO);

        setPaginationHeaders(res, persons);

        return persons.items;
    }
}
