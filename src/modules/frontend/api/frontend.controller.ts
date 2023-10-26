import { Session as FastifySession } from '@fastify/secure-session';
import { Body, Controller, HttpCode, HttpStatus, Param, Patch, Post, Session, UseGuards } from '@nestjs/common';
import {
    ApiAcceptedResponse,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AxiosResponse } from 'axios';
import { TokenSet } from 'openid-client';
import { Observable, map, tap } from 'rxjs';

import { LoginService } from '../outbound/login.service.js';
import { AuthenticatedGuard } from './authentication.guard.js';
import { LoginParams } from './user.params.js';
import { PersonByIdParams } from '../../person/api/person-by-id.param.js';
import { ResetPasswordResponse, UserService } from '../outbound/user.service.js';

export type SessionData = FastifySession<{
    keycloak_tokens: TokenSet;
}>;

@ApiTags('frontend')
@Controller({ path: 'frontend' })
export class FrontendController {
    public constructor(private loginService: LoginService, private userService: UserService) {}

    @Post('login')
    @ApiAcceptedResponse({ description: 'The person was successfully logged in.' })
    public login(@Body() loginParams: LoginParams, @Session() session: SessionData): Observable<void> {
        return this.loginService.login(loginParams.username, loginParams.password).pipe(
            tap(({ data }: AxiosResponse<TokenSet>): void => {
                session.set('keycloak_tokens', new TokenSet(data));
            }),
            map(() => undefined),
        );
    }

    @UseGuards(AuthenticatedGuard)
    @Post('logout')
    @ApiAcceptedResponse({ description: 'The person was successfully logged out.' })
    public logout(@Session() session: SessionData): void {
        session.delete();
    }

    @UseGuards(AuthenticatedGuard)
    @Patch('user/:personId/password')
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiAcceptedResponse({ description: 'Password for person was successfully reset.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to reset password for user.' })
    @ApiNotFoundResponse({ description: 'The person does not exist.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error.' })
    public resetPasswordByPersonId(@Param() params: PersonByIdParams): Observable<ResetPasswordResponse> {
        return this.userService
            .resetPasswordForUserByUserId(params.personId)
            .pipe(map((res: AxiosResponse<ResetPasswordResponse>) => res.data));
    }
}
