import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    ApiAcceptedResponse,
    ApiForbiddenResponse,
    ApiOkResponse,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { UserinfoResponse } from 'openid-client';

import { FrontendConfig, ServerConfig } from '../../../shared/config/index.js';
import { AuthenticatedGuard, CurrentUser, LoginGuard, User } from '../auth/index.js';

@ApiTags('frontend')
@Controller({ path: 'frontend' })
export class FrontendController {
    private redirect: string;

    public constructor(configService: ConfigService<ServerConfig>) {
        this.redirect = configService.getOrThrow<FrontendConfig>('FRONTEND').REDIRECT_AFTER_AUTH;
    }

    @UseGuards(LoginGuard)
    @Get('login')
    @ApiOperation({ summary: 'Used to start OIDC authentication.' })
    @ApiResponse({ status: 302, description: 'Redirection to orchestrate OIDC flow.' })
    public login(@Res() res: Response): void {
        res.redirect(this.redirect);
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
