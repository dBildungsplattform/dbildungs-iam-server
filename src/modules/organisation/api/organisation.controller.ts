import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Body, Controller, Inject, Post } from '@nestjs/common';
import { OrganisationUc } from './organisation.uc.js';
import {
    ApiBadRequestResponse,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateOrganisationBodyParams } from './create-organisation.body.params.js';
import { CreateOrganisationDto } from './create-organisation.dto.js';
import { OrganisationResponse } from './organisation.response.js';
import { CreatedOrganisationDto } from './created-organisation.dto.js';

@ApiTags('organisation')
@Controller({ path: 'organisation' })
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
}
