import {
    Controller,
    Get,
    Inject,
    InternalServerErrorException,
    Query,
    Req,
    Res,
    Session,
    UseGuards,
} from '@nestjs/common';
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
import { Client, UserinfoResponse } from 'openid-client';

import { FrontendConfig, ServerConfig } from '../../../shared/config/index.js';
import { AuthenticatedGuard, CurrentUser, LoginGuard, OIDC_CLIENT, User } from '../auth/index.js';
import { RedirectQueryParams } from './redirect.query.params.js';

@ApiTags('frontend')
@Controller({ path: 'frontend' })
export class FrontendController {
    private defaultRedirect: string;

    public constructor(configService: ConfigService<ServerConfig>, @Inject(OIDC_CLIENT) private client: Client) {
        this.defaultRedirect = configService.getOrThrow<FrontendConfig>('FRONTEND').DEFAULT_AUTH_REDIRECT;
    }

    @UseGuards(LoginGuard)
    @Get('login')
    @ApiOperation({ summary: 'Used to start OIDC authentication.' })
    @ApiResponse({ status: 302, description: 'Redirection to orchestrate OIDC flow.' })
    @ApiQuery({ type: RedirectQueryParams })
    public login(@Res() res: Response, @Session() session: SessionData): void {
        const target: string = session.redirectUrl ?? this.defaultRedirect;
        session.redirectUrl = undefined;
        res.redirect(target);
    }

    @Get('logout')
    @ApiAcceptedResponse({ description: 'The person was successfully logged out.' })
    public logout(@Req() req: Request, @Res() res: Response, @Query() query: RedirectQueryParams): void {
        const user: User | undefined = req.user as User | undefined;
        const idToken: string | undefined = user?.id_token;

        req.logout((logoutErr?: Error) => {
            if (logoutErr) {
                throw new InternalServerErrorException('Could not log out', { cause: logoutErr });
            }

            req.session.destroy((destroyErr?: Error) => {
                if (destroyErr) {
                    throw new InternalServerErrorException('Could not destroy session', { cause: destroyErr });
                }

                const redirectUrl: string = query.redirectUrl ?? this.defaultRedirect;

                if (idToken && this.client.issuer.metadata.end_session_endpoint) {
                    const endSessionUrl: string = this.client.endSessionUrl({
                        id_token_hint: idToken,
                        post_logout_redirect_uri: redirectUrl,
                        client_id: this.client.metadata.client_id,
                    });

                    res.redirect(endSessionUrl);
                } else {
                    res.redirect(redirectUrl);
                }
            });
        });
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
