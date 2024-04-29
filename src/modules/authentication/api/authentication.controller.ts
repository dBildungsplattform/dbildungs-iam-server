import { Controller, Get, Inject, Req, Res, Session, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    ApiBearerAuth,
    ApiInternalServerErrorResponse,
    ApiOAuth2,
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
import { PersonPermissions } from '../domain/person-permissions.js';
import { Permissions } from './permissions.decorator.js';
import { Public } from './public.decorator.js';
import { PersonenkontextRolleFields } from '../domain/person-permissions.js';
import { RolleID } from '../../../shared/types/index.js';
import { PersonenkontextRolleFieldsResponse } from './Personen-kontext-rolle-fields.response.js';
import { RollenSystemRechtServiceProviderIDResponse } from './rolle-systemrechte-serviceproviderid.response.js';
@ApiTags('auth')
@Controller({ path: 'auth' })
export class AuthenticationController {
    private readonly defaultLoginRedirect: string;

    private readonly logoutRedirect: string;

    public constructor(
        configService: ConfigService<ServerConfig>,
        @Inject(OIDC_CLIENT) private client: Client,
        private readonly logger: ClassLogger,
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
    @ApiBearerAuth()
    @ApiOAuth2(['openid'])
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
    @ApiBearerAuth()
    @ApiOAuth2(['openid'])
    @ApiOperation({ summary: 'Info about logged in user.' })
    @ApiUnauthorizedResponse({ description: 'User is not logged in.' })
    @ApiOkResponse({ description: 'Returns info about the logged in user.', type: UserinfoResponse })
    public async info(@Permissions() permissions: PersonPermissions): Promise<UserinfoResponse> {
        const roleIds: RolleID[] = await permissions.getRoleIds();
        this.logger.info('Roles: ' + roleIds.toString());
        this.logger.info('User: ' + JSON.stringify(permissions.personFields));
        const rolleFields: PersonenkontextRolleFields[] = await permissions.getPersonenkontextewithRoles();
        const rolleFieldsResponse: PersonenkontextRolleFieldsResponse[] = rolleFields.map(
            (field: PersonenkontextRolleFields) =>
                new PersonenkontextRolleFieldsResponse(
                    field.organisationsId,
                    new RollenSystemRechtServiceProviderIDResponse(
                        field.rolle.systemrechte,
                        field.rolle.serviceProviderIds,
                    ),
                ),
        );
        return new UserinfoResponse(permissions, rolleFieldsResponse);
    }
}
