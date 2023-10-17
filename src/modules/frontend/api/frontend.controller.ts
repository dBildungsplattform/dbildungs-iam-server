import { Body, Controller, HttpStatus, Post, Res, Session, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiAcceptedResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { AuthenticatedGuard } from './authentication.guard.js';
import { AuthenticationInterceptor } from './authentication.interceptor.js';
import { LoginService } from '../outbound/login.service.js';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { TokenSet } from 'openid-client';
import { LoginParams } from './user.params.js';

export type SessionData = Express.Request['session'] &
    Partial<{
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
    public async login(@Body() loginParams: LoginParams, @Session() session: SessionData): Promise<string> {
        const response: AxiosResponse<TokenSet> = await firstValueFrom(
            this.loginService.login(loginParams.username, loginParams.password),
        );

        if (response.data.access_token) {
            session.access_token = response.data.access_token;
        }

        return 'Logged in.';
    }

    @UseGuards(AuthenticatedGuard)
    @Post('logout')
    @ApiAcceptedResponse({ description: 'The person was successfully logged out.' })
    public logout(@Session() session: SessionData, @Res() res: Response): void {
        session.destroy((err: unknown) => {
            if (err) {
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error while logging out' });
            } else {
                res.status(HttpStatus.OK).json({ message: 'Successfully logged out' });
            }
        });
    }
}
