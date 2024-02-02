import { Body, Controller, HttpCode, HttpStatus, Post, UseFilters } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { DomainError } from '../../../shared/error/domain.error.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { OrganisationService } from '../../organisation/domain/organisation.service.js';
import { Rolle } from '../domain/rolle.js';
import { RolleRepo } from '../repo/rolle.repo.js';
import { CreateRolleBodyParams } from './create-rolle.body.params.js';
import { RolleResponse } from './rolle.response.js';

@UseFilters(SchulConnexValidationErrorFilter)
@ApiTags('rolle')
@Controller({ path: 'rolle' })
export class RolleController {
    public constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly orgService: OrganisationService,
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
        const orgResult: Result<OrganisationDo<true>, DomainError> = await this.orgService.findOrganisationById(
            params.administeredBySchulstrukturknoten,
        );

        if (!orgResult.ok) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(orgResult.error),
            );
        }

        const rolle: Rolle<false> = Rolle.createNew(
            params.name,
            params.administeredBySchulstrukturknoten,
            params.rollenart,
            params.merkmale,
        );

        const result: Rolle<true> = await this.rolleRepo.save(rolle);

        return result;
    }
}
