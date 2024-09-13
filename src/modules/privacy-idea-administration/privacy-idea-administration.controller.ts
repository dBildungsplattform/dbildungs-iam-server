import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpException,
    HttpStatus,
    Post,
    Put,
    Query,
    UseFilters,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiOAuth2,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { EntityCouldNotBeCreated } from '../../shared/error/entity-could-not-be-created.error.js';
import { EntityCouldNotBeUpdated } from '../../shared/error/entity-could-not-be-updated.error.js';
import { SchulConnexErrorMapper } from '../../shared/error/schul-connex-error.mapper.js';
import { Permissions } from '../authentication/api/permissions.decorator.js';
import { Public } from '../authentication/api/public.decorator.js';
import { PersonPermissions } from '../authentication/domain/person-permissions.js';
import { Person } from '../person/domain/person.js';
import { PersonRepository } from '../person/persistence/person.repository.js';
import { AssignHardwareTokenBodyParams } from './api/assign-hardware-token.body.params.js';
import { AssignHardwareTokenResponse } from './api/assign-hardware-token.response.js';
import { TokenError } from './api/error/token.error.js';
import { PrivacyIdeaAdministrationExceptionFilter } from './api/privacy-idea-administration-exception-filter.js';
import { TokenRequiredResponse } from './api/token-required.response.js';
import { PrivacyIdeaAdministrationService } from './privacy-idea-administration.service.js';
import { AssignTokenResponse, PrivacyIdeaToken, ResetTokenResponse } from './privacy-idea-api.types.js';
import { TokenInitBodyParams } from './token-init.body.params.js';
import { TokenStateResponse } from './token-state.response.js';

@UseFilters(new PrivacyIdeaAdministrationExceptionFilter())
@ApiTags('2FA')
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@Controller('2fa-token')
export class PrivacyIdeaAdministrationController {
    public constructor(
        private readonly privacyIdeaAdministrationService: PrivacyIdeaAdministrationService,
        private readonly personRepository: PersonRepository,
    ) {}

    @Post('init')
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({ description: 'The token was successfully created.', type: String })
    @ApiBadRequestResponse({ description: 'A username was not given or not found.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to create token.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to create token.' })
    @ApiNotFoundResponse({ description: 'Insufficient permissions to create token.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while creating a token.' })
    @Public()
    public async initializeSoftwareToken(
        @Body() params: TokenInitBodyParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<string> {
        const referrer: string = await this.getPersonIfAllowed(params.personId, permissions);
        return this.privacyIdeaAdministrationService.initializeSoftwareToken(referrer);
    }

    @Get('state')
    @HttpCode(HttpStatus.OK)
    @ApiCreatedResponse({ description: 'The token state was successfully returned.', type: TokenStateResponse })
    @ApiBadRequestResponse({ description: 'A username was not given or not found.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get token state.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get token state.' })
    @ApiNotFoundResponse({ description: 'Insufficient permissions to get token state.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while retrieving token state.' })
    @Public()
    public async getTwoAuthState(
        @Query('personId') personId: string,
        @Permissions() permissions: PersonPermissions,
    ): Promise<TokenStateResponse> {
        const referrer: string = await this.getPersonIfAllowed(personId, permissions);
        const piToken: PrivacyIdeaToken | undefined =
            await this.privacyIdeaAdministrationService.getTwoAuthState(referrer);
        return new TokenStateResponse(piToken);
    }

    @Put('reset')
    @HttpCode(HttpStatus.OK)
    @ApiCreatedResponse({ description: 'The token was successfully reset.', type: Boolean })
    @ApiBadRequestResponse({ description: 'A username was not given or not found.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to reset token.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to reset token.' })
    @ApiNotFoundResponse({ description: 'Insufficient permissions to reset token.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while reseting a token.' })
    @Public()
    public async resetToken(
        @Query('personId') personId: string,
        @Permissions() permissions: PersonPermissions,
    ): Promise<boolean> {
        const referrer: string = await this.getPersonIfAllowed(personId, permissions);
        try {
            const response: ResetTokenResponse = await this.privacyIdeaAdministrationService.resetToken(referrer);
            return response.result.status;
        } catch (error) {
            if (error instanceof TokenError) {
                throw error;
            }
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new EntityCouldNotBeUpdated(referrer, 'Token could not be unassigned.'),
                ),
            );
        }
    }

    @Post('assign/hardwareToken')
    @HttpCode(HttpStatus.OK)
    @ApiCreatedResponse({
        description: 'The hardware token was successfully assigned.',
        type: AssignHardwareTokenResponse,
    })
    @ApiBadRequestResponse({ description: 'Not found.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to assign hardware token.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to reset token.' })
    @ApiNotFoundResponse({ description: 'Insufficient permissions to assign hardware token.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while assigning a hardware token.' })
    @Public()
    public async assignHardwareToken(
        @Body() params: AssignHardwareTokenBodyParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<AssignHardwareTokenResponse | undefined> {
        const referrer: string = await this.getPersonIfAllowed(params.userId, permissions);
        try {
            const result: AssignTokenResponse = await this.privacyIdeaAdministrationService.assignHardwareToken(
                params.serial,
                params.otp,
                referrer,
            );
            return new AssignHardwareTokenResponse(
                result.id,
                result.jsonrpc,
                result.time,
                result.version,
                result.versionnumber,
                result.signature,
                'Token wurde erfolgreich zugeordnet.',
            );
        } catch (error) {
            if (error instanceof TokenError) {
                throw error;
            }
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new EntityCouldNotBeCreated('Hardware-Token could not be assigned.'),
                ),
            );
        }
    }

    @Get('required')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        description: 'The requirement was successfully returned.',
        type: TokenRequiredResponse,
    })
    @ApiBadRequestResponse({ description: 'A username was not given or not found.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get requirement information.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get requirement information.' })
    @ApiNotFoundResponse({ description: 'Insufficient permissions to get requirement information.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting requirement information.' })
    public async requiresTwoFactorAuthentication(
        @Query('personId') personId: string,
        @Permissions() permissions: PersonPermissions,
    ): Promise<TokenRequiredResponse> {
        await this.getPersonIfAllowed(personId, permissions);

        const requires2fa: boolean = await this.privacyIdeaAdministrationService.requires2fa(personId);
        return new TokenRequiredResponse(requires2fa);
    }

    private async getPersonIfAllowed(personId: string, permissions: PersonPermissions): Promise<string> {
        const personResult: Result<Person<true>> = await this.personRepository.getPersonIfAllowed(
            personId,
            permissions,
        );
        if (!personResult.ok) {
            throw new HttpException(personResult.error, HttpStatus.FORBIDDEN);
        }
        if (personResult.value.referrer === undefined) {
            throw new HttpException('User not found.', HttpStatus.BAD_REQUEST);
        }
        return personResult.value.referrer;
    }
}
