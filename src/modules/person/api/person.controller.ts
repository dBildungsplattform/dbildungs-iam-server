import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    Param,
    Patch,
    Post,
    Put,
    Query,
    UseFilters,
    UseInterceptors,
} from '@nestjs/common';
import {
    ApiAcceptedResponse,
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { SchulConnexError } from '../../../shared/error/schul-connex.error.js';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { Paged, PagedResponse, PagingHeadersObject } from '../../../shared/paging/index.js';
import { ResultInterceptor } from '../../../shared/util/result-interceptor.js';
import { PersonUc } from '../api/person.uc.js';
import { CreatePersonBodyParams } from './create-person.body.params.js';
import { CreatePersonDto } from './create-person.dto.js';
import { CreatePersonenkontextBodyParams } from '../../personenkontext/api/create-personenkontext.body.params.js';
import { CreatePersonenkontextDto } from '../../personenkontext/api/create-personenkontext.dto.js';
import { CreatedPersonenkontextDto } from '../../personenkontext/api/created-personenkontext.dto.js';
import { FindPersonendatensatzDto } from './find-personendatensatz.dto.js';
import { FindPersonenkontextDto } from '../../personenkontext/api/find-personenkontext.dto.js';
import { PersonByIdParams } from './person-by-id.param.js';
import { PersonDto } from './person.dto.js';
import { PersonenQueryParams } from './personen-query.param.js';
import { PersonendatensatzDto } from './personendatensatz.dto.js';
import { PersonendatensatzResponse } from './personendatensatz.response.js';
import { PersonenkontextQueryParams } from '../../personenkontext/api/personenkontext-query.params.js';
import { PersonenkontextDto } from '../../personenkontext/api/personenkontext.dto.js';
import { PersonenkontextResponse } from '../../personenkontext/api/personenkontext.response.js';
import { PersonenkontextUc } from '../../personenkontext/api/personenkontext.uc.js';
import { UpdatePersonBodyParams } from './update-person.body.params.js';
import { UpdatePersonDto } from './update-person.dto.js';
import { PersonRepository } from '../persistence/person.repository.js';
import { EntityNotFoundError } from '../../../shared/error/index.js';
import { Person } from '../domain/person.js';
import { PersonendatensatzResponseDDD } from './personendatensatz.responseDDD.js';
import { PersonScope } from '../persistence/person.scope.js';
import { ScopeOrder } from '../../../shared/persistence/index.js';
import { PersonDo } from '../domain/person.do.js';

@UseFilters(SchulConnexValidationErrorFilter)
@ApiTags('personen')
@ApiBearerAuth()
@Controller({ path: 'personen' })
export class PersonController {
    public constructor(
        private readonly personUc: PersonUc,
        private readonly personenkontextUc: PersonenkontextUc,
        private readonly personRepository: PersonRepository,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({ description: 'The person was successfully created.', type: PersonendatensatzResponse })
    @ApiBadRequestResponse({ description: 'A username was given. Creation with username is not supported' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to create the person.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to create the person.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while creating the person.' })
    public async createPerson(@Body() params: CreatePersonBodyParams): Promise<PersonendatensatzResponse> {
        const dto: CreatePersonDto = this.mapper.map(params, CreatePersonBodyParams, CreatePersonDto);
        const result: PersonDto | SchulConnexError = await this.personUc.createPerson(dto);

        if (result instanceof SchulConnexError) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(result);
        }

        const personendatensatzDto: PersonendatensatzDto = {
            person: result,
            personenkontexte: [],
        };
        const personendatensatzResponse: PersonendatensatzResponse = this.mapper.map(
            personendatensatzDto,
            PersonendatensatzDto,
            PersonendatensatzResponse,
        );
        return personendatensatzResponse;
    }

    // --403 DONE--
    @Get(':personId')
    @ApiOkResponse({ description: 'The person was successfully returned.', type: PersonendatensatzResponseDDD })
    @ApiBadRequestResponse({ description: 'Person ID is required' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get the person.' })
    @ApiNotFoundResponse({ description: 'The person does not exist.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get the person.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting the person.' })
    public async findPersonById(@Param() params: PersonByIdParams): Promise<PersonendatensatzResponseDDD> {
        const person: Option<Person<true>> = await this.personRepository.findById(params.personId);
        if (!person) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new EntityNotFoundError(`Person with the following ID ${params.personId} does not exist`),
                ),
            );
        }

        return new PersonendatensatzResponseDDD(person);
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

        const result: CreatedPersonenkontextDto | SchulConnexError =
            await this.personenkontextUc.createPersonenkontext(personenkontextDto);

        if (result instanceof SchulConnexError) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(result);
        }

        return this.mapper.map(result, CreatedPersonenkontextDto, PersonenkontextResponse);
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
        /*
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
        */

        const findDto: FindPersonendatensatzDto = this.mapper.map(
            queryParams,
            PersonenQueryParams,
            FindPersonendatensatzDto,
        );

        const personDo: Partial<PersonDo<false>> = this.mapper.map(findDto, FindPersonendatensatzDto, PersonDo);

        const scope: PersonScope = new PersonScope()
            .findBy({
                vorname: personDo.vorname,
                familienname: personDo.familienname,
                geburtsdatum: personDo.geburtsdatum,
            })
            .sortBy('vorname', ScopeOrder.ASC)
            .paged(queryParams.offset, queryParams.limit);

        const [persons, total]: Counted<Person<true>> = await this.personRepository.findBy(scope);
    }

    @Put(':personId')
    @ApiOkResponse({
        description: 'The person was successfully updated.',
        type: PersonendatensatzResponse,
    })
    @ApiBadRequestResponse({ description: 'Request has wrong format.' })
    @ApiUnauthorizedResponse({ description: 'Request is not authorized.' })
    @ApiNotFoundResponse({ description: 'The person was not found.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to perform operation.' })
    @ApiInternalServerErrorResponse({ description: 'An internal server error occurred.' })
    public async updatePerson(
        @Param() params: PersonByIdParams,
        @Body() body: UpdatePersonBodyParams,
    ): Promise<PersonendatensatzResponse> {
        const dto: UpdatePersonDto = this.mapper.map(body, UpdatePersonBodyParams, UpdatePersonDto);
        dto.id = params.personId;

        const response: PersonendatensatzDto | SchulConnexError = await this.personUc.updatePerson(dto);

        if (response instanceof SchulConnexError) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(response);
        }

        return this.mapper.map(response, PersonendatensatzDto, PersonendatensatzResponse);
    }

    @Patch(':personId/password')
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiAcceptedResponse({ description: 'Password for person was successfully reset.', type: String })
    @ApiNotFoundResponse({ description: 'The person does not exist.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error.' })
    @UseInterceptors(ResultInterceptor)
    public async resetPasswordByPersonId(@Param() params: PersonByIdParams): Promise<Result<string>> {
        const result: Result<string> | SchulConnexError = await this.personUc.resetPassword(params.personId);

        if (result instanceof SchulConnexError) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(result);
        }

        return result;
    }
}
