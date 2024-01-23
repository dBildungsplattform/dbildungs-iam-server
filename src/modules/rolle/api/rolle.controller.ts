import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Body, Controller, HttpCode, HttpStatus, Inject, Post, UseFilters } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Public } from 'nest-keycloak-connect';

import { OrganisationService } from '../../organisation/domain/organisation.service.js';
import { Rolle } from '../domain/rolle.js';
import { RolleRepo } from '../repo/rolle.repo.js';
import { CreateRolleBodyParams } from './create-rolle.body.params.js';
import { RolleResponse } from './rolle.response.js';
import { SchulConnexError } from '../../../shared/error/schul-connex.error.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';

@UseFilters(SchulConnexValidationErrorFilter)
@ApiTags('rolle')
@Controller({ path: 'rolle' })
@Public()
export class RolleController {
    public constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly organisationService: OrganisationService,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ description: 'Create a new rolle.' })
    @ApiCreatedResponse({ description: 'The rolle was successfully created.', type: RolleResponse })
    @ApiBadRequestResponse({ description: 'The input was not valid.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to create the rolle.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to create the rolle.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while creating the person.' })
    public async createRolle(@Body() params: CreateRolleBodyParams): Promise<RolleResponse> {
        const rolle: Rolle = this.mapper.map(params, CreateRolleBodyParams, Rolle);

        const result: void | SchulConnexError = await rolle.save(this.rolleRepo, this.organisationService);
        if (result instanceof SchulConnexError) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(result);
        }

        return this.mapper.map(rolle, Rolle, RolleResponse);
    }
}
