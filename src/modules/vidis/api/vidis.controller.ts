import { Controller, HttpCode, HttpStatus, Param, Put, UseFilters, UseGuards } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiOAuth2,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Permissions } from '../../authentication/api/permissions.decorator.js';
import { OrganisationByIdParams } from '../../organisation/api/organisation-by-id.params.js';
import { IPersonPermissions } from '../../../shared/permissions/person-permissions.interface.js';
import { VidisSyncService } from '../core/vidis.sync-service.js';
import { VidisExceptionFilter } from './vidis-exception-filter.js';
import { StepUpGuard } from '../../authentication/api/steup-up.guard.js';

@ApiTags('vidis')
@ApiOAuth2(['openid'])
@ApiBearerAuth()
@Controller({ path: 'vidis' })
@UseFilters(VidisExceptionFilter)
export class VidisController {
    public constructor(private readonly vidisSyncService: VidisSyncService) {}

    @Put(':organisationId/angebote-sync')
    @UseGuards(StepUpGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ description: 'Sync VIDIS Angebote for a school organisation.' })
    @ApiOkResponse({ description: 'The VIDIS Angebote sync was successfully triggered.' })
    @ApiBadRequestResponse({ description: 'The organisationId is invalid or cannot be synced.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to trigger the VIDIS Angebote sync.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to trigger the VIDIS Angebote sync.' })
    @ApiNotFoundResponse({ description: 'The organisation does not exist or lacks required permissions.' })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error while trying to trigger the VIDIS Angebote sync.',
    })
    public async syncAngeboteForSchool(
        @Permissions() permissions: IPersonPermissions,
        @Param() params: OrganisationByIdParams,
    ): Promise<void> {
        const result: Result<void, Error> = await this.vidisSyncService.syncAngeboteForSchool(
            params.organisationId,
            permissions,
        );

        if (!result.ok) {
            throw result.error;
        }
    }
}
