import { Session as FastifySession } from '@fastify/secure-session';
import {
    Body,
    Controller,
    HttpException,
    InternalServerErrorException,
    Post,
    Session,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { ApiAcceptedResponse, ApiTags } from '@nestjs/swagger';
import { AxiosError, AxiosResponse } from 'axios';
import { TokenSet } from 'openid-client';
import { Observable, catchError, map, tap } from 'rxjs';

import { LoginService } from '../outbound/login.service.js';
import { AuthenticatedGuard } from './authentication.guard.js';
import { AuthenticationInterceptor } from './authentication.interceptor.js';
import { LoginParams } from './user.params.js';

export type SessionData = FastifySession<{
    user_id: string;
    access_token: string;
}>;

@ApiTags('frontend')
@Controller({ path: 'frontend' })
@UseInterceptors(AuthenticationInterceptor)
export class FrontendController {
    public constructor(private loginService: LoginService) {}

    @Post('login')
    @ApiAcceptedResponse({ description: 'The person was successfully logged in.' })
    public login(@Body() loginParams: LoginParams, @Session() session: SessionData): Observable<void> {
        return this.loginService.login(loginParams.username, loginParams.password).pipe(
            tap((response: AxiosResponse<TokenSet>): void => {
                session.set('access_token', response.data.access_token);
            }),
            catchError((e: AxiosError<string | Record<string, unknown>>) => {
                if (e.response) {
                    throw new HttpException(e.response.data, e.response.status);
                }
                throw new InternalServerErrorException(e);
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
