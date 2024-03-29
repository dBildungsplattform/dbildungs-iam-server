import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Body, Controller, Get, Inject, Param, Post, Put, Query, UseFilters } from '@nestjs/common';
import {
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
import { Paged, PagingHeadersObject } from '../../../shared/paging/index.js';
import { PagedResponse } from '../../../shared/paging/paged.response.js';
import { CreateOrganisationBodyParams } from './create-organisation.body.params.js';
import { CreateOrganisationDto } from './create-organisation.dto.js';
import { CreatedOrganisationDto } from './created-organisation.dto.js';
import { FindOrganisationQueryParams } from './find-organisation-query.param.js';
import { FindOrganisationDto } from './find-organisation.dto.js';
import { OrganisationByIdParams } from './organisation-by-id.params.js';
import { OrganisationResponse } from './organisation.response.js';
import { OrganisationUc } from './organisation.uc.js';
import { UpdateOrganisationBodyParams } from './update-organisation.body.params.js';
import { UpdateOrganisationDto } from './update-organisation.dto.js';
import { UpdatedOrganisationDto } from './updated-organisation.dto.js';
import { OrganisationByIdBodyParams } from './organisation-by-id.body.params.js';

@UseFilters(SchulConnexValidationErrorFilter)
@ApiTags('organisationen')
@ApiBearerAuth()
@Controller({ path: 'organisationen' })
export class OrganisationController {
    public constructor(
        private readonly uc: OrganisationUc,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    @Post()
    @ApiCreatedResponse({ description: 'The organisation was successfully created.', type: OrganisationResponse })
    @ApiBadRequestResponse({ description: 'The organisation already exists.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to create the organisation.' })
    @ApiForbiddenResponse({ description: 'Not permitted to create the organisation.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while creating the organisation.' })
    public async createOrganisation(@Body() params: CreateOrganisationBodyParams): Promise<OrganisationResponse> {
        const organisationDto: CreateOrganisationDto = this.mapper.map(
            params,
            CreateOrganisationBodyParams,
            CreateOrganisationDto,
        );
        const result: CreatedOrganisationDto | SchulConnexError = await this.uc.createOrganisation(organisationDto);

        if (result instanceof CreatedOrganisationDto) {
            return this.mapper.map(result, CreatedOrganisationDto, OrganisationResponse);
        }
        throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(result);
    }

    @Put(':organisationId')
    @ApiOkResponse({
        description: 'The organisation was successfully updated.',
        type: OrganisationResponse,
    })
    @ApiBadRequestResponse({ description: 'Request has wrong format.' })
    @ApiUnauthorizedResponse({ description: 'Request is not authorized.' })
    @ApiNotFoundResponse({ description: 'The organisation was not found.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to perform operation.' })
    @ApiInternalServerErrorResponse({ description: 'An internal server error occurred.' })
    public async updateOrganisation(
        @Param() params: OrganisationByIdParams,
        @Body() body: UpdateOrganisationBodyParams,
    ): Promise<OrganisationResponse> {
        const dto: UpdateOrganisationDto = this.mapper.map(body, UpdateOrganisationBodyParams, UpdateOrganisationDto);
        dto.id = params.organisationId;

        const response: UpdatedOrganisationDto | SchulConnexError = await this.uc.updateOrganisation(dto);

        if (response instanceof UpdatedOrganisationDto) {
            return this.mapper.map(response, UpdatedOrganisationDto, OrganisationResponse);
        }
        throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(response);
    }

    @Get('root')
    @ApiOkResponse({ description: 'The organization was successfully pulled.', type: OrganisationResponse })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get the organization.' })
    @ApiNotFoundResponse({ description: 'The organization does not exist.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get the organization.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting the organization.' })
    public async getRootOrganisation(): Promise<OrganisationResponse> {
        const result: OrganisationResponse | SchulConnexError = await this.uc.findRootOrganisation();

        if (result instanceof OrganisationResponse) {
            return result;
        }

        throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(result);
    }

    @Get(':organisationId')
    @ApiOkResponse({ description: 'The organization was successfully pulled.', type: OrganisationResponse })
    @ApiBadRequestResponse({ description: 'Organization ID is required' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get the organization.' })
    @ApiNotFoundResponse({ description: 'The organization does not exist.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get the organization.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting the organization.' })
    public async findOrganisationById(@Param() params: OrganisationByIdParams): Promise<OrganisationResponse> {
        const result: OrganisationResponse | SchulConnexError = await this.uc.findOrganisationById(
            params.organisationId,
        );

        if (result instanceof OrganisationResponse) {
            return result;
        }
        throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(result);
    }

    @Get()
    @ApiOkResponse({
        description: 'The organizations were successfully returned.',
        type: [OrganisationResponse],
        headers: PagingHeadersObject,
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get organizations.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get organizations.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting all organizations.' })
    public async findOrganizations(
        @Query() queryParams: FindOrganisationQueryParams,
    ): Promise<PagedResponse<OrganisationResponse>> {
        const organisationDto: FindOrganisationDto = this.mapper.map(
            queryParams,
            FindOrganisationQueryParams,
            FindOrganisationDto,
        );

        const organisations: Paged<OrganisationResponse> = await this.uc.findAll(organisationDto);
        const response: PagedResponse<OrganisationResponse> = new PagedResponse(organisations);

        return response;
    }

    @Get(':organisationId/administriert')
    @ApiOkResponse({
        description: 'The organizations were successfully returned.',
        type: [OrganisationResponse],
        headers: PagingHeadersObject,
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get organizations.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get organizations.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting all organizations.' })
    public async getAdministrierteOrganisationen(
        @Param() params: OrganisationByIdParams,
    ): Promise<PagedResponse<OrganisationResponse>> {
        const result: Paged<OrganisationResponse> | SchulConnexError = await this.uc.findAdministriertVon(
            params.organisationId,
        );

        if (result instanceof SchulConnexError) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(result);
        }
        const response: PagedResponse<OrganisationResponse> = new PagedResponse(result);

        return response;
    }

    @Post(':organisationId/administriert')
    @ApiCreatedResponse({ description: 'The organisation was successfully updated.' })
    @ApiBadRequestResponse({ description: 'The organisation could not be modified.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to modify the organisation.' })
    @ApiForbiddenResponse({ description: 'Not permitted to modify the organisation.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while modifying the organisation.' })
    public async addAdministrierteOrganisation(
        @Param() params: OrganisationByIdParams,
        @Body() body: OrganisationByIdBodyParams,
    ): Promise<void> {
        const result: void | SchulConnexError = await this.uc.setAdministriertVon(
            params.organisationId,
            body.organisationId,
        );

        if (result) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(result);
        }
    }

    @Get(':organisationId/zugehoerig')
    @ApiOkResponse({
        description: 'The organizations were successfully returned.',
        type: [OrganisationResponse],
        headers: PagingHeadersObject,
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get organizations.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get organizations.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting all organizations.' })
    public async getZugehoerigeOrganisationen(
        @Param() params: OrganisationByIdParams,
    ): Promise<PagedResponse<OrganisationResponse>> {
        const result: Paged<OrganisationResponse> | SchulConnexError = await this.uc.findZugehoerigZu(
            params.organisationId,
        );

        if (result instanceof SchulConnexError) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(result);
        }
        const response: PagedResponse<OrganisationResponse> = new PagedResponse(result);

        return response;
    }

    @Post(':organisationId/zugehoerig')
    @ApiCreatedResponse({ description: 'The organisation was successfully updated.' })
    @ApiBadRequestResponse({ description: 'The organisation could not be modified.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to modify the organisation.' })
    @ApiForbiddenResponse({ description: 'Not permitted to modify the organisation.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while modifying the organisation.' })
    public async addZugehoerigeOrganisation(
        @Param() params: OrganisationByIdParams,
        @Body() body: OrganisationByIdBodyParams,
    ): Promise<void> {
        const result: void | SchulConnexError = await this.uc.setZugehoerigZu(
            params.organisationId,
            body.organisationId,
        );

        if (result) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(result);
        }
    }
}
