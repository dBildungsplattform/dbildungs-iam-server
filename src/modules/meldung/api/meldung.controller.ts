import { Controller, Get, UseFilters } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiOAuth2,
    ApiOkResponse,
    ApiOperation,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { ServiceProviderResponse } from '../../service-provider/api/service-provider.response.js';
import { AuthenticationExceptionFilter } from '../../authentication/api/authentication-exception-filter.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { Permissions } from '../../authentication/api/permissions.decorator.js';
import { RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { MissingPermissionsError } from '../../../shared/error/index.js';

@UseFilters(SchulConnexValidationErrorFilter, new AuthenticationExceptionFilter())
@ApiOAuth2(['openid'])
@ApiBearerAuth()
@Controller({ path: 'meldung' })
export class MeldungController {
    @Get('all')
    @ApiOperation({ description: 'Get all meldungen.' })
    @ApiOkResponse({
        description: 'The meldungen were successfully returned.',
        type: [ServiceProviderResponse],
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get available meldungen.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get meldungen.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting all meldungen.' })
    public async getAllServiceProviders(@Permissions() permissions: PersonPermissions): Promise<null> {
        const requiredSytsmrechte: RollenSystemRecht[] = [
            RollenSystemRecht.SCHULPORTAL_VERWALTEN,
            RollenSystemRecht.HINWEISE_BEARBEITEN,
        ];
        const hasRequiredSystemrechte: boolean =
            await permissions.hasSystemrechteAtRootOrganisation(requiredSytsmrechte);
        if (!hasRequiredSystemrechte) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new MissingPermissionsError(
                        'Schulportal Bearbeiten & Hinweise Bearbeiten Systemrecht Required For This Endpoint',
                    ),
                ),
            );
        }

        return null;
    }
}
