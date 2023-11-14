import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Body, Controller, Get, HttpException, HttpStatus, Inject, Param, Post, Query, UseFilters } from '@nestjs/common';
import { OrganisationUc } from './organisation.uc.js';
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
import { CreateOrganisationBodyParams } from './create-organisation.body.params.js';
import { CreateOrganisationDto } from './create-organisation.dto.js';
import { OrganisationResponse } from './organisation.response.js';
import { CreatedOrganisationDto } from './created-organisation.dto.js';
import { OrganisationByIdParams } from './organisation-by-id.params.js';
import { Public } from 'nest-keycloak-connect';
import { FindOrganisationDto } from './find-organisation.dto.js';
import { PagedResponse } from '../../../shared/paging/paged.response.js';
import { Paged, PagingHeadersObject } from '../../../shared/paging/index.js';
import { FindOrganisationQueryParams } from './find-organisation-query.param.js';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';

@UseFilters(SchulConnexValidationErrorFilter)
@ApiTags('organisationen')
@Controller({ path: 'organisationen' })
@Public()
export class OrganisationController {
    public constructor(
        private readonly uc: OrganisationUc,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    @Post()
    @ApiCreatedResponse({ description: 'The organisation was successfully created.' })
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
        const createdOrganisation: CreatedOrganisationDto = await this.uc.createOrganisation(organisationDto);
        return this.mapper.map(createdOrganisation, CreatedOrganisationDto, OrganisationResponse);
    }

    @Get(':organisationId')
    @ApiOkResponse({ description: 'The organization was successfully pulled.' })
    @ApiBadRequestResponse({ description: 'Organization ID is required' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get the organization.' })
    @ApiNotFoundResponse({ description: 'The organization does not exist.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get the organization.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting the organization.' })
    public async findOrganisationById(
        @Param() params: OrganisationByIdParams,
    ): Promise<OrganisationResponse | HttpException> {
        try {
            const organisation: OrganisationResponse = await this.uc.findOrganisationById(params.organisationId);
            return organisation;
        } catch (error) {
            throw new HttpException('Requested Entity does not exist', HttpStatus.NOT_FOUND);
        }
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
}
