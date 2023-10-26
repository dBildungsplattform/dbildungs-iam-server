import { Controller, Get, Post, Redirect, Req, UseGuards } from '@nestjs/common';
import {
    ApiAcceptedResponse,
    ApiForbiddenResponse,
    ApiOkResponse,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { UserinfoResponse } from 'openid-client';

import { AuthenticatedGuard, CurrentUser, LoginGuard, User } from '../auth/index.js';

@ApiTags('frontend')
@Controller({ path: 'frontend' })
export class FrontendController {
    @UseGuards(LoginGuard)
    @Get('login')
    @ApiOperation({ summary: 'Used to start OIDC authentication.' })
    @ApiResponse({ status: 302, description: 'Redirection to orchestrate OIDC flow.' })
    @Redirect('/api/frontend/logininfo', 302)
    public login(): void {}

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
