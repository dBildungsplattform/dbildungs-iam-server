import { Body, Controller, HttpStatus, Post, UseFilters } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiServiceUnavailableResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserParams } from './user.params.js';
import { LoginService } from '../domain/login.service.js';
import { TokenSet } from 'openid-client';
import { KeyCloakExceptionFilter } from './key-cloak-exception-filter.js';
import { UserAuthenticationFailedExceptionFilter } from './user-authentication-failed-exception-filter.js';

@ApiTags('login')
@Controller({ path: 'login' })
export class LoginController {
    public constructor(private loginService: LoginService) {}

    @Post()
    @UseFilters(
        new KeyCloakExceptionFilter(HttpStatus.SERVICE_UNAVAILABLE),
        new UserAuthenticationFailedExceptionFilter(HttpStatus.NOT_FOUND),
    )
    @ApiOkResponse({ description: 'Request successful, returning token.' })
    @ApiBadRequestResponse({ description: 'Bad request for retrieving token.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to retrieve token.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to retrieve token.' })
    @ApiNotFoundResponse({
        description: 'USER_AUTHENTICATION_FAILED_ERROR: User could not be authenticated successfully.',
    })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while retrieving token.' })
    @ApiServiceUnavailableResponse({ description: 'KEYCLOAK_CLIENT_ERROR: KeyCloak service did not respond.' })
    public async loginUser(@Body() params: UserParams): Promise<TokenSet> {
        return this.loginService.getTokenForUser(params.username, params.password);
    }
}
