import { Body, Controller, HttpStatus, Post, UseFilters } from '@nestjs/common';
import {
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiServiceUnavailableResponse,
    ApiTags,
} from '@nestjs/swagger';
import { UserParams } from './user.params.js';
import { LoginService } from '../domain/login.service.js';
import { TokenSet } from 'openid-client';
import { KeyCloakExceptionFilter } from './key-cloak-exception-filter.js';
import { UserAuthenticationFailedExceptionFilter } from './user-authentication-failed-exception-filter.js';
import { NewLoginService } from '../domain/new-login.service.js';
import { DomainError } from '../../../shared/error/index.js';

@ApiTags('login')
@Controller({ path: 'login' })
export class LoginController {
    public constructor(private loginService: LoginService, private someService: NewLoginService) {}

    @Post()
    @UseFilters(
        new KeyCloakExceptionFilter(HttpStatus.SERVICE_UNAVAILABLE),
        new UserAuthenticationFailedExceptionFilter(HttpStatus.NOT_FOUND),
    )
    @ApiNotFoundResponse({
        description: 'USER_AUTHENTICATION_FAILED_ERROR: User could not be authenticated successfully.',
    })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while retrieving token.' })
    @ApiServiceUnavailableResponse({ description: 'KEYCLOAK_CLIENT_ERROR: KeyCloak service did not respond.' })
    public async loginUser(@Body() params: UserParams): Promise<TokenSet> {
        return this.loginService.getTokenForUser(params.username, params.password);
    }

    @Post('result')
    @UseFilters(
        new KeyCloakExceptionFilter(HttpStatus.SERVICE_UNAVAILABLE),
        new UserAuthenticationFailedExceptionFilter(HttpStatus.NOT_FOUND),
    )
    @ApiNotFoundResponse({
        description: 'USER_AUTHENTICATION_FAILED_ERROR: User could not be authenticated successfully.',
    })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while retrieving token.' })
    public async loginUserResult(@Body() params: UserParams): Promise<Result<string, DomainError>> {
        return this.someService.auth(params.username, params.password);
    }
}
