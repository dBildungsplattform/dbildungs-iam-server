import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiOAuth2,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';
import { RollenartRepo } from '../repo/rollenart.repo.js';

@ApiTags('Rollenart')
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@Controller({ path: 'rollenart' })
export class RollenartController {
    public constructor(private readonly rollenartRepo: RollenartRepo) {}

    @Get()
    @ApiOkResponse({ description: 'The list of LMS roles was successfully returned', type: [String] })
    @ApiUnauthorizedResponse({ description: 'Unauthorized to retrieve all LMS roles' })
    @ApiNotFoundResponse({ description: 'No LMS roles found' })
    @ApiForbiddenResponse({ description: 'Insufficient rights to retrieve all LMS roles' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while retrieving LMS roles' })
    public getAllLmsRollenarten(): string[] {
        return this.rollenartRepo.getAllRollenarten();
    }
}
