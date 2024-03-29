import { Controller, Get, Inject, Req, Res, Session, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    ApiInternalServerErrorResponse,
    ApiOkResponse,
    ApiOperation,
    ApiQuery,
    ApiResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { SessionData } from 'express-session';
import { Client } from 'openid-client';

import { FrontendConfig, ServerConfig } from '../../../shared/config/index.js';
import { OIDC_CLIENT } from '../services/oidc-client.service.js';
import { LoginGuard } from './login.guard.js';
import { RedirectQueryParams } from './redirect.query.params.js';
import { UserinfoResponse } from './userinfo.response.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { AuthenticatedUser, Public } from 'nest-keycloak-connect';
import { User } from '../types/user.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { Person } from '../../person/domain/person.js';

@ApiTags('auth')
@Controller({ path: 'auth' })
export class AuthenticationController {
    private readonly defaultLoginRedirect: string;

    private readonly logoutRedirect: string;

    public constructor(
        configService: ConfigService<ServerConfig>,
        @Inject(OIDC_CLIENT) private client: Client,
        private readonly logger: ClassLogger,
        private readonly personRepository: PersonRepository,
    ) {
        const frontendConfig: FrontendConfig = configService.getOrThrow<FrontendConfig>('FRONTEND');
        this.defaultLoginRedirect = frontendConfig.DEFAULT_LOGIN_REDIRECT;
        this.logoutRedirect = frontendConfig.LOGOUT_REDIRECT;
    }

    @Get('login')
    @Public()
    @UseGuards(LoginGuard)
    @ApiOperation({ summary: 'Used to start OIDC authentication.' })
    @ApiResponse({ status: 302, description: 'Redirection to orchestrate OIDC flow.' })
    @ApiQuery({ type: RedirectQueryParams })
    public login(@Res() res: Response, @Session() session: SessionData): void {
        const target: string = session.redirectUrl ?? this.defaultLoginRedirect;
        res.redirect(target);
    }

    @Get('logout')
    @Public()
    @ApiOperation({ summary: 'Used to log out the current user.' })
    @ApiResponse({ status: 302, description: 'Redirect to logout.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while trying to log out.' })
    public logout(@Req() req: Request, @Res() res: Response): void {
        const idToken: string | undefined = req.passportUser?.id_token;

        req.logout((logoutErr?: Error) => {
            if (logoutErr) {
                // Error should not stop logout process
                this.logger.info('An error occurres while trying to log out', logoutErr);
            }

            req.session.destroy((destroyErr?: Error) => {
                if (destroyErr) {
                    // Error should not stop logout process
                    this.logger.info('An error occurred while trying to destroy the session', destroyErr);
                }

                if (this.client.issuer.metadata.end_session_endpoint) {
                    const endSessionUrl: string = this.client.endSessionUrl({
                        id_token_hint: idToken,
                        post_logout_redirect_uri: this.logoutRedirect,
                        client_id: this.client.metadata.client_id,
                    });

                    res.redirect(endSessionUrl);
                } else {
                    res.redirect(this.logoutRedirect);
                }
            });
        });
    }

    @Get('logininfo')
    @ApiOperation({ summary: 'Info about logged in user.' })
    @ApiUnauthorizedResponse({ description: 'User is not logged in.' })
    @ApiOkResponse({ description: 'Returns info about the logged in user.', type: UserinfoResponse })
    public async info(@AuthenticatedUser() user: User): Promise<UserinfoResponse> {
        const person: Person<true> | null | undefined = await this.personRepository.findByKeycloakUserId(user.sub);
        return new UserinfoResponse(user, person);
    }
}
