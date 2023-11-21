import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpException,
    HttpStatus,
    Inject,
    Param,
    Patch,
    Post,
    Query,
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
import { Public } from 'nest-keycloak-connect';
import { Paged, PagedResponse, PagingHeadersObject } from '../../../shared/paging/index.js';
import { ResultInterceptor } from '../../../shared/util/result-interceptor.js';
import { PersonUc } from '../api/person.uc.js';
import { CreatePersonBodyParams } from './create-person.body.params.js';
import { CreatePersonDto } from './create-person.dto.js';
import { CreatePersonenkontextBodyParams } from './create-personenkontext.body.params.js';
import { CreatePersonenkontextDto } from './create-personenkontext.dto.js';
import { CreatedPersonenkontextDto } from './created-personenkontext.dto.js';
import { FindPersonendatensatzDto } from './find-personendatensatz.dto.js';
import { FindPersonenkontextDto } from './find-personenkontext.dto.js';
import { PersonByIdParams } from './person-by-id.param.js';
import { PersonDto } from './person.dto.js';
import { PersonenQueryParams } from './personen-query.param.js';
import { PersonendatensatzDto } from './personendatensatz.dto.js';
import { PersonendatensatzResponse } from './personendatensatz.response.js';
import { PersonenkontextQueryParams } from './personenkontext-query.params.js';
import { PersonenkontextDto } from './personenkontext.dto.js';
import { PersonenkontextResponse } from './personenkontext.response.js';
import { PersonenkontextUc } from './personenkontext.uc.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';

@ApiTags('personen')
@Controller({ path: 'personen' })
@Public()
export class PersonController {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly personUc: PersonUc,
        private readonly personenkontextUc: PersonenkontextUc,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    @Post()
    @HttpCode(200)
    @ApiCreatedResponse({ description: 'The person was successfully created.' })
    @ApiBadRequestResponse({ description: 'The person already exists.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to create the person.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to create the person.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while creating the person.' })
    public async createPerson(@Body() params: CreatePersonBodyParams): Promise<PersonendatensatzResponse> {
        this.logger.emerg('This is an emerg message');
        this.logger.alert('this is an alert message');
        this.logger.crit('this is a crit message');
        this.logger.error('this is an error message');
        this.logger.warning('this is a warning message');
        this.logger.notice('this is a notice message');
        this.logger.info('this is an info message');
        this.logger.debug('this is a debug message');
        const dto: CreatePersonDto = this.mapper.map(params, CreatePersonBodyParams, CreatePersonDto);
        const person: PersonDto = await this.personUc.createPerson(dto);
        const personendatensatzDto: PersonendatensatzDto = {
            person: person,
            personenkontexte: [],
        };
        const personendatensatzResponse: PersonendatensatzResponse = this.mapper.map(
            personendatensatzDto,
            PersonendatensatzDto,
            PersonendatensatzResponse,
        );
        return personendatensatzResponse;
    }

    @Get(':personId')
    @ApiOkResponse({ description: 'The person was successfully returned.', type: PersonendatensatzResponse })
    @ApiBadRequestResponse({ description: 'Person ID is required' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get the person.' })
    @ApiNotFoundResponse({ description: 'The person does not exist.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get the person.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting the person.' })
    public async findPersonById(@Param() params: PersonByIdParams): Promise<PersonendatensatzResponse | HttpException> {
        try {
            const dto: PersonendatensatzDto = await this.personUc.findPersonById(params.personId);
            const response: PersonendatensatzResponse = this.mapper.map(
                dto,
                PersonendatensatzDto,
                PersonendatensatzResponse,
            );
            return response;
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

        const createdPersonenkontext: CreatedPersonenkontextDto =
            await this.personenkontextUc.createPersonenkontext(personenkontextDto);
        return this.mapper.map(createdPersonenkontext, CreatedPersonenkontextDto, PersonenkontextResponse);
    }

    @Get(':personId/personenkontexte')
    @ApiOkResponse({ description: 'The personenkontexte were successfully pulled.', headers: PagingHeadersObject })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get personenkontexte.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get personenkontexte.' })
    @ApiNotFoundResponse({ description: 'No personenkontexte were found.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting all personenkontexte.' })
    public async findPersonenkontexte(
        @Param() pathParams: PersonByIdParams,
        @Query() queryParams: PersonenkontextQueryParams,
    ): Promise<PagedResponse<PersonenkontextResponse>> {
        const findPersonenkontextDto: FindPersonenkontextDto = this.mapper.map(
            queryParams,
            PersonenkontextQueryParams,
            FindPersonenkontextDto,
        );

        findPersonenkontextDto.personId = pathParams.personId;

        const personenkontextDtos: Paged<PersonenkontextDto> =
            await this.personenkontextUc.findAll(findPersonenkontextDto);
        // AI next 5 lines
        const responseItems: PersonenkontextResponse[] = this.mapper.mapArray(
            personenkontextDtos.items,
            PersonenkontextDto,
            PersonenkontextResponse,
        );

        return new PagedResponse({
            items: responseItems,
            offset: personenkontextDtos.offset,
            limit: personenkontextDtos.limit,
            total: personenkontextDtos.total,
        });
    }

    @Get()
    @ApiOkResponse({
        description:
            'The persons were successfully returned. WARNING: This endpoint returns all persons as default when no paging parameters were set.',
        type: [PersonendatensatzResponse],
        headers: PagingHeadersObject,
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get persons.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get persons.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting all persons.' })
    public async findPersons(
        @Query() queryParams: PersonenQueryParams,
    ): Promise<PagedResponse<PersonendatensatzResponse>> {
        const findDto: FindPersonendatensatzDto = this.mapper.map(
            queryParams,
            PersonenQueryParams,
            FindPersonendatensatzDto,
        );
        const pagedDtos: Paged<PersonendatensatzDto> = await this.personUc.findAll(findDto);
        const response: PagedResponse<PersonendatensatzResponse> = new PagedResponse({
            offset: pagedDtos.offset,
            limit: pagedDtos.limit,
            total: pagedDtos.total,
            items: this.mapper.mapArray(pagedDtos.items, PersonendatensatzDto, PersonendatensatzResponse),
        });

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
