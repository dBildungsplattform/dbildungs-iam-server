import { Controller, Get, Post, Req, Res, Session, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    ApiAcceptedResponse,
    ApiForbiddenResponse,
    ApiOkResponse,
    ApiOperation,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { SessionData } from 'express-session';
import { UserinfoResponse } from 'openid-client';

import { FrontendConfig, ServerConfig } from '../../../shared/config/index.js';
import { AuthenticatedGuard, CurrentUser, LoginGuard, User } from '../auth/index.js';

@ApiTags('frontend')
@Controller({ path: 'frontend' })
export class FrontendController {
    private defaultRedirect: string;

    public constructor(configService: ConfigService<ServerConfig>) {
        this.defaultRedirect = configService.getOrThrow<FrontendConfig>('FRONTEND').DEFAULT_AUTH_REDIRECT;
    }

    @UseGuards(LoginGuard)
    @Get('login')
    @ApiOperation({ summary: 'Used to start OIDC authentication.' })
    @ApiResponse({ status: 302, description: 'Redirection to orchestrate OIDC flow.' })
    @ApiQuery({
        name: 'redirectUrl',
        required: false,
        type: 'string',
        description: 'User will be redirected here after login',
    })
    public login(@Res() res: Response, @Session() session: SessionData): void {
        const target: string = session.redirectUrl ?? this.defaultRedirect;
        session.redirectUrl = undefined;
        res.redirect(target);
    }

    @UseGuards(AuthenticatedGuard)
    @Post('logout')
    @ApiAcceptedResponse({ description: 'The person was successfully logged out.' })
    public logout(@Req() req: Request): void {
        req.session.destroy(() => {});
    }

    @Get('logininfo')
    @UseGuards(AuthenticatedGuard)
    @ApiOperation({ summary: 'Info about logged in user.' })
    @ApiForbiddenResponse({ description: 'User is not logged in.' })
    @ApiOkResponse({ description: 'Returns info about the logged in user.' })
    public info(@CurrentUser() user: User): UserinfoResponse {
        return user.userinfo;
    }
}
