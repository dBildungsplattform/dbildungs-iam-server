import { Session as FastifySession } from '@fastify/secure-session';
import { Body, Controller, Post, Session, UseGuards } from '@nestjs/common';
import { ApiAcceptedResponse, ApiTags } from '@nestjs/swagger';
import { AxiosResponse } from 'axios';
import { TokenSet } from 'openid-client';
import { Observable, map, tap } from 'rxjs';

import { LoginService } from '../outbound/login.service.js';
import { AuthenticatedGuard } from './authentication.guard.js';
import { LoginParams } from './user.params.js';

export type SessionData = FastifySession<{
    keycloak_tokens: TokenSet;
}>;

@ApiTags('frontend')
@Controller({ path: 'frontend' })
export class FrontendController {
    public constructor(private loginService: LoginService) {}

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
}
