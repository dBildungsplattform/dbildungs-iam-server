import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import {
    Body,
    Controller,
    Get,
    Inject,
    Post,
    Param,
    HttpException,
    HttpStatus,
    Query,
    HttpCode,
    Patch,
    UseInterceptors,
} from '@nestjs/common';
import {
    ApiAcceptedResponse,
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
import { Paged, PagedResponse, PagingHeadersObject } from '../../../shared/paging/index.js';
import { PersonenQueryParams } from './personen-query.param.js';
import { FindPersonendatensatzDto } from './find-personendatensatz.dto.js';
import { PersonendatensatzResponse } from './personendatensatz.response.js';
import { CreatePersonenkontextBodyParams } from './create-personenkontext.body.params.js';
import { CreatePersonenkontextDto } from './create-personenkontext.dto.js';
import { CreatedPersonenkontextDto } from './created-personenkontext.dto.js';
import { PersonenkontextResponse } from './personenkontext.response.js';
import { PersonenkontextUc } from './personenkontext.uc.js';
import { PersonenkontextQueryParams } from './personenkontext-query.params.js';
import { FindPersonenkontextDto } from './find-personenkontext.dto.js';
import { Public } from 'nest-keycloak-connect';
import { ResultInterceptor } from '../../../shared/util/result-interceptor.js';

@ApiTags('person')
@Controller({ path: 'person' })
@Public()
export class PersonController {
    public constructor(
        private readonly personUc: PersonUc,
        private readonly personenkontextUc: PersonenkontextUc,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    @Post()
    @ApiCreatedResponse({ description: 'The person was successfully created.' })
    @ApiBadRequestResponse({ description: 'The person already exists.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to create the person.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to create the person.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while creating the person.' })
    public async createPerson(@Body() params: CreatePersonBodyParams): Promise<void> {
        const dto: CreatePersonDto = this.mapper.map(params, CreatePersonBodyParams, CreatePersonDto);
        await this.personUc.createPerson(dto);
    }

    @Get(':personId')
    @ApiOkResponse({ description: 'The person was successfully returned.' })
    @ApiBadRequestResponse({ description: 'Person ID is required' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get the person.' })
    @ApiNotFoundResponse({ description: 'The person does not exist.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get the person.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting the person.' })
    public async findPersonById(@Param() params: PersonByIdParams): Promise<PersonendatensatzResponse | HttpException> {
        try {
            const person: PersonendatensatzResponse = await this.personUc.findPersonById(params.personId);
            return person;
        } catch (error) {
            throw new HttpException('Requested entity does not exist', HttpStatus.NOT_FOUND);
        }
    }

    @Post(':personId/personenkontexte')
    @HttpCode(200)
    @ApiOkResponse({ description: 'The personenkontext was successfully created.' })
    @ApiBadRequestResponse({ description: 'The personenkontext already exists.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to create the personenkontext.' })
    @ApiForbiddenResponse({ description: 'Not permitted to create the personenkontext.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while creating the personenkontext.' })
    public async createPersonenkontext(
        @Param() pathParams: PersonByIdParams,
        @Body() bodyParams: CreatePersonenkontextBodyParams,
    ): Promise<PersonenkontextResponse> {
        const personenkontextDto: CreatePersonenkontextDto = this.mapper.map(
            bodyParams,
            CreatePersonenkontextBodyParams,
            CreatePersonenkontextDto,
        );
        personenkontextDto.personId = pathParams.personId;

        const createdPersonenkontext: CreatedPersonenkontextDto = await this.personenkontextUc.createPersonenkontext(
            personenkontextDto,
        );
        return this.mapper.map(createdPersonenkontext, CreatedPersonenkontextDto, PersonenkontextResponse);
    }

    @Get(':personId/personenkontexte')
    @ApiOkResponse({ description: 'The personenkontexte were successfully pulled.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get personenkontexte.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get personenkontexte.' })
    @ApiNotFoundResponse({ description: 'No personenkontexte were found.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting all personenkontexte.' })
    public async findPersonenkontexte(
        @Param() pathParams: PersonByIdParams,
        @Query() queryParams: PersonenkontextQueryParams,
    ): Promise<PersonenkontextResponse[]> {
        const findPersonenkontextDto: FindPersonenkontextDto = this.mapper.map(
            queryParams,
            PersonenkontextQueryParams,
            FindPersonenkontextDto,
        );

        findPersonenkontextDto.personId = pathParams.personId;

        const personenkontexte: PersonenkontextResponse[] = await this.personenkontextUc.findAll(
            findPersonenkontextDto,
        );

        return personenkontexte;
    }

    @Get()
    @ApiOkResponse({
        description: 'The persons were successfully returned.',
        type: [PersonendatensatzResponse],
        headers: PagingHeadersObject,
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get persons.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get persons.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting all persons.' })
    public async findPersons(
        @Query() queryParams: PersonenQueryParams,
    ): Promise<PagedResponse<PersonendatensatzResponse>> {
        const personDatensatzDTO: FindPersonendatensatzDto = this.mapper.map(
            queryParams,
            PersonenQueryParams,
            FindPersonendatensatzDto,
        );
        const persons: Paged<PersonendatensatzResponse> = await this.personUc.findAll(personDatensatzDTO);
        const response: PagedResponse<PersonendatensatzResponse> = new PagedResponse(persons);

        return response;
    }

    @Patch(':personId/password')
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiAcceptedResponse({ description: 'Password for person was successfully reset.' })
    @ApiNotFoundResponse({ description: 'The person does not exist.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error.' })
    @UseInterceptors(ResultInterceptor)
    public async resetPasswordByPersonId(@Param() params: PersonByIdParams): Promise<Result<string> | HttpException> {
        return this.personUc.resetPassword(params.personId);
    }
}
