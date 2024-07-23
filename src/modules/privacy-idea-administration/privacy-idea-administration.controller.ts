import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { PrivacyIdeaAdministrationService } from './privacy-idea-administration.service.js';
import { Public } from '../authentication/api/public.decorator.js';
import { InitSoftwareTokenResponse, PrivacyIdeaToken, ResetTokenResponse } from './privacy-idea-api.types.js';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiOAuth2,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('2FA')
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@Controller('2fa-token')
export class PrivacyIdeaAdministrationController {
    public constructor(private readonly privacyIdeaAdministrationService: PrivacyIdeaAdministrationService) {}

    @Post('init')
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({ description: 'The token was successfully created.', type: PrivacyIdeaAdministrationService })
    @ApiBadRequestResponse({ description: 'A username was not given or not found.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to create token.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to create token.' })
    @ApiNotFoundResponse({ description: 'Insufficient permissions to create token.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while creating a token.' })
    @Public()
    public async initializeSoftwareToken(@Body() params: { userName: string }): Promise<InitSoftwareTokenResponse> {
        return this.privacyIdeaAdministrationService.initializeSoftwareToken(params.userName);
    }

    @Get('state')
    @HttpCode(HttpStatus.OK)
    @ApiCreatedResponse({ description: 'The token was successfully created.', type: PrivacyIdeaAdministrationService })
    @ApiBadRequestResponse({ description: 'A username was not given or not found.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to create token.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to create token.' })
    @ApiNotFoundResponse({ description: 'Insufficient permissions to create token.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while creating a token.' })
    @Public()
    public async getTwoAuthState(@Query('userName') userName: string): Promise<PrivacyIdeaToken | undefined> {
        return this.privacyIdeaAdministrationService.getTwoAuthState(userName);
    }

    @Get('reset')
    @HttpCode(HttpStatus.OK)
    @ApiCreatedResponse({ description: 'The token was successfully reset.', type: PrivacyIdeaAdministrationService })
    @ApiBadRequestResponse({ description: 'A username was not given or not found.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to reset token.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to reset token.' })
    @ApiNotFoundResponse({ description: 'Insufficient permissions to reset token.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while reseting a token.' })
    @Public()
    public async resetToken(@Query('userName') userName: string): Promise<ResetTokenResponse| undefined> {
        return this.privacyIdeaAdministrationService.resetToken(userName)
    }
}
