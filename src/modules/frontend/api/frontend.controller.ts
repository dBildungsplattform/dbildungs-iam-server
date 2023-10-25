import { Session as FastifySession } from '@fastify/secure-session';
import { Body, Controller, Param, Patch, Post, Session, UseGuards } from '@nestjs/common';
import { ApiAcceptedResponse, ApiTags } from '@nestjs/swagger';
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
    @ApiAcceptedResponse({ description: 'Password for person was successfully reset.' })
    public resetPasswordByPersonId(@Param() params: PersonByIdParams): Observable<ResetPasswordResponse> {
        return this.userService
            .resetPasswordForUserByUserId(params.personId)
            .pipe(map((res: AxiosResponse<ResetPasswordResponse>) => res.data));
    }
}
