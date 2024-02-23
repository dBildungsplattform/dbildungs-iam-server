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
import { PersonendatensatzResponseDDD } from './personendatensatz.responseDDD.js';
import { PersonScope } from '../persistence/person.scope.js';
import { ScopeOrder } from '../../../shared/persistence/index.js';
import { KeycloakUserService } from '../../keycloak-administration/index.js';
import { UsernameGeneratorService } from '../domain/username-generator.service.js';

@UseFilters(SchulConnexValidationErrorFilter)
@ApiTags('personen')
@ApiBearerAuth()
@Controller({ path: 'personen' })
export class PersonController {
    public constructor(
        private readonly personenkontextUc: PersonenkontextUc,
        private readonly personRepository: PersonRepository,
        private readonly usernameGenerator: UsernameGeneratorService,
        private readonly kcUserService: KeycloakUserService,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    // --403 DONE--
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({ description: 'The person was successfully created.', type: PersonendatensatzResponseDDD })
    @ApiBadRequestResponse({ description: 'A username was given. Creation with username is not supported' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to create the person.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to create the person.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while creating the person.' })
    public async createPerson(@Body() params: CreatePersonBodyParams): Promise<PersonendatensatzResponseDDD> {
        const person: Person<false> = Person.createNew(
            params.name.familienname,
            params.name.vorname,
            params.referrer,
            params.stammorganisation,
            params.name.initialenfamilienname,
            params.name.initialenvorname,
            params.name.rufname,
            params.name.titel,
            params.name.anrede,
            params.name.namenspraefix,
            params.name.namenssuffix,
            params.name.sortierindex,
            params.geburt?.datum,
            params.geburt?.geburtsort,
            params.geschlecht,
            params.lokalisierung,
            params.vertrauensstufe,
            params.auskunftssperre,
        );

        const result: Person<true> | DomainError = await this.personRepository.create(
            person,
            this.kcUserService,
            this.usernameGenerator,
        );

        if (result instanceof DomainError) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(result),
            );
        }

        return new PersonendatensatzResponseDDD(result);
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

        return new PersonendatensatzResponseDDD(person, true);
    }

    // -- 403 NOT IN SCOPE ?
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

    // -- 403 NOT IN SCOPE ?
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

    // --403 DONE--
    @Get()
    @ApiOkResponse({
        description:
            'The persons were successfully returned. WARNING: This endpoint returns all persons as default when no paging parameters were set.',
        type: [PersonendatensatzResponseDDD],
        headers: PagingHeadersObject,
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get persons.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get persons.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting all persons.' })
    public async findPersons(
        @Query() queryParams: PersonenQueryParams,
    ): Promise<PagedResponse<PersonendatensatzResponseDDD>> {
        const scope: PersonScope = new PersonScope()
            .findBy({
                vorname: undefined,
                familienname: undefined,
                geburtsdatum: undefined,
            })
            .sortBy('vorname', ScopeOrder.ASC)
            .paged(queryParams.offset, queryParams.limit);

        const [persons, total]: Counted<Person<true>> = await this.personRepository.findBy(scope);

        const response: PagedResponse<PersonendatensatzResponseDDD> = new PagedResponse({
            offset: queryParams.offset ?? 0,
            limit: queryParams.limit ?? total,
            total: total,
            items: persons.map((person: Person<true>) => new PersonendatensatzResponseDDD(person)),
        });

        return response;
    }

    // --403 DONE--
    @Put(':personId')
    @ApiOkResponse({
        description: 'The person was successfully updated.',
        type: PersonendatensatzResponseDDD,
    })
    @ApiBadRequestResponse({ description: 'Request has wrong format.' })
    @ApiUnauthorizedResponse({ description: 'Request is not authorized.' })
    @ApiNotFoundResponse({ description: 'The person was not found.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to perform operation.' })
    @ApiInternalServerErrorResponse({ description: 'An internal server error occurred.' })
    public async updatePerson(
        @Param() params: PersonByIdParams,
        @Body() body: UpdatePersonBodyParams,
    ): Promise<PersonendatensatzResponseDDD> {
        const person: Option<Person<true>> = await this.personRepository.findById(params.personId);
        if (!person) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new EntityNotFoundError(`Person with the following ID ${params.personId} does not exist`),
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
        return new PersonendatensatzResponseDDD(person, false);
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
                    new EntityNotFoundError(`Person with the following ID ${params.personId} does not exist`),
                ),
            );
        }
        person.resetPassword();
        const saveResult: Person<true> | DomainError = await this.personRepository.saveUser(
            person,
            this.kcUserService,
            this.usernameGenerator,
        );

        if (saveResult instanceof DomainError) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(saveResult),
            );
        }

        return { ok: true, value: person.newPassword };
    }
}
