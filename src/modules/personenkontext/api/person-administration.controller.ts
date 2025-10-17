import { Controller, Get, Query, UseFilters } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiOAuth2,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { Permissions } from '../../authentication/api/permissions.decorator.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { PersonAdministrationService } from '../domain/person-administration.service.js';
import { FindPersonenkontextRollenBodyParams } from './param/find-personenkontext-rollen.body.params.js';
import { PersonenkontextExceptionFilter } from './personenkontext-exception-filter.js';
import { FindRollenResponse } from './response/find-rollen.response.js';

@UseFilters(SchulConnexValidationErrorFilter, new PersonenkontextExceptionFilter())
@ApiTags('person-administration')
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@Controller({ path: 'person-administration' })
export class PersonAdministrationController {
    public constructor(private readonly personAdministrationService: PersonAdministrationService) {}

    @Get('rollen')
    @ApiOkResponse({
        description: 'The rollen for the logged-in user were successfully returned.',
        type: FindRollenResponse,
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get available rollen for the logged-in user.' })
    @ApiForbiddenResponse({ description: 'Insufficient permission to get rollen for the logged-in user.' })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error while getting rollen for the logged-in user.',
    })
    public async findRollen(
        @Query() params: FindPersonenkontextRollenBodyParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<FindRollenResponse> {
        const rollen: Rolle<true>[] = await this.personAdministrationService.findAuthorizedRollen(
            permissions,
            params.rolleName,
            params.limit,
        );
        const response: FindRollenResponse = new FindRollenResponse(rollen, rollen.length);

        return response;
    }
}
