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
    ApiOAuth2,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { SchulConnexError } from '../../../shared/error/schul-connex.error.js';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { ApiOkResponsePaginated, Paged, PagedResponse, PagingHeadersObject } from '../../../shared/paging/index.js';
import { ResultInterceptor } from '../../../shared/util/result-interceptor.js';
import { CreatePersonBodyParams } from './create-person.body.params.js';
import { CreatePersonenkontextBodyParams } from '../../personenkontext/api/create-personenkontext.body.params.js';
import { CreatePersonenkontextDto } from '../../personenkontext/api/create-personenkontext.dto.js';
import { CreatedPersonenkontextDto } from '../../personenkontext/api/created-personenkontext.dto.js';
import { FindPersonenkontextDto } from '../../personenkontext/api/find-personenkontext.dto.js';
import { PersonByIdParams } from './person-by-id.param.js';
import { PersonenQueryParams } from './personen-query.param.js';
import { PersonenkontextQueryParams } from '../../personenkontext/api/personenkontext-query.params.js';
import { PersonenkontextDto } from '../../personenkontext/api/personenkontext.dto.js';
import { PersonenkontextResponse } from '../../personenkontext/api/personenkontext.response.js';
import { PersonenkontextUc } from '../../personenkontext/api/personenkontext.uc.js';
import { UpdatePersonBodyParams } from './update-person.body.params.js';
import { PersonRepository } from '../persistence/person.repository.js';
import { DomainError, EntityNotFoundError } from '../../../shared/error/index.js';
import { Person } from '../domain/person.js';
import { PersonendatensatzResponse } from './personendatensatz.response.js';
import { PersonScope } from '../persistence/person.scope.js';
import { ScopeOrder } from '../../../shared/persistence/index.js';
import { PersonFactory } from '../domain/person.factory.js';

@UseFilters(SchulConnexValidationErrorFilter)
@ApiTags('personen')
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@Controller({ path: 'personen' })
export class PersonController {
    public constructor(
        private readonly personenkontextUc: PersonenkontextUc,
        private readonly personRepository: PersonRepository,
        private readonly personFactory: PersonFactory,
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
        const person: Person<false> | DomainError = await this.personFactory.createNew({
            vorname: params.name.vorname,
            familienname: params.name.familienname,
            initialenFamilienname: params.name.initialenfamilienname,
            initialenVorname: params.name.initialenvorname,
            rufname: params.name.rufname,
            nameTitel: params.name.titel,
            nameAnrede: params.name.anrede,
            namePraefix: params.name.namenspraefix,
            nameSuffix: params.name.namenssuffix,
            nameSortierindex: params.name.sortierindex,
            auskunftssperre: params.auskunftssperre,
            geburtsdatum: params.geburt?.datum,
            geburtsort: params.geburt?.geburtsort,
            ...params,
        });
        if (person instanceof DomainError) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(person),
            );
        }

        const result: Person<true> | DomainError = await this.personRepository.create(person);
        if (result instanceof DomainError) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(result),
            );
        }

        return new PersonendatensatzResponse(result, true);
    }

    @Get(':personId')
    @ApiOkResponse({ description: 'The person was successfully returned.', type: PersonendatensatzResponse })
    @ApiBadRequestResponse({ description: 'Person ID is required' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get the person.' })
    @ApiNotFoundResponse({ description: 'The person does not exist.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get the person.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting the person.' })
    public async findPersonById(@Param() params: PersonByIdParams): Promise<PersonendatensatzResponse> {
        const person: Option<Person<true>> = await this.personRepository.findById(params.personId);
        if (!person) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new EntityNotFoundError('Person', params.personId),
                ),
            );
        }

        return new PersonendatensatzResponse(person, false);
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
    @ApiOkResponsePaginated(PersonenkontextResponse, {
        description: 'The personenkontexte were successfully pulled.',
        headers: PagingHeadersObject,
    })
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
        const scope: PersonScope = new PersonScope()
            .findBy({
                vorname: undefined,
                familienname: undefined,
                geburtsdatum: undefined,
            })
            .sortBy('vorname', ScopeOrder.ASC)
            .paged(queryParams.offset, queryParams.limit);

        const [persons, total]: Counted<Person<true>> = await this.personRepository.findBy(scope);

        const response: PagedResponse<PersonendatensatzResponse> = new PagedResponse({
            offset: queryParams.offset ?? 0,
            limit: queryParams.limit ?? total,
            total: total,
            items: persons.map((person: Person<true>) => new PersonendatensatzResponse(person, false)),
        });

        return response;
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
        const person: Option<Person<true>> = await this.personRepository.findById(params.personId);
        if (!person) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new EntityNotFoundError('Person', params.personId),
                ),
            );
        }
        const updateResult: void | DomainError = person.update(
            body.revision,
            body.name.familienname,
            body.name.vorname,
            body.referrer,
            body.stammorganisation,
            body.name.initialenfamilienname,
            body.name.initialenvorname,
            body.name.rufname,
            body.name.titel,
            body.name.anrede,
            body.name.namenspraefix,
            body.name.namenssuffix,
            body.name.sortierindex,
            body.geburt?.datum,
            body.geburt?.geburtsort,
            body.geschlecht,
            body.lokalisierung,
            body.vertrauensstufe,
            body.auskunftssperre,
        );
        if (updateResult instanceof DomainError) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(updateResult),
            );
        }
        await this.personRepository.update(person);

        return new PersonendatensatzResponse(person, false);
    }

    @Patch(':personId/password')
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiAcceptedResponse({ description: 'Password for person was successfully reset.', type: String })
    @ApiNotFoundResponse({ description: 'The person does not exist.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error.' })
    @UseInterceptors(ResultInterceptor)
    public async resetPasswordByPersonId(@Param() params: PersonByIdParams): Promise<Result<string>> {
        const person: Option<Person<true>> = await this.personRepository.findById(params.personId);
        if (!person) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new EntityNotFoundError('Person', params.personId),
                ),
            );
        }
        person.resetPassword();
        const saveResult: Person<true> | DomainError = await this.personRepository.update(person);

        if (saveResult instanceof DomainError) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(saveResult),
            );
        }

        return { ok: true, value: person.newPassword! };
    }
}
