import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    Logger,
    Param,
    Patch,
    Post,
    Query,
    Req,
    Res,
    Session,
    UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    ApiAcceptedResponse,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiQuery,
    ApiResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { SessionData } from 'express-session';
import { Client, UserinfoResponse } from 'openid-client';

import { FrontendConfig, ServerConfig } from '../../../shared/config/index.js';
import { GetServiceProviderInfoDo } from '../../rolle/domain/get-service-provider-info.do.js';
import { AuthenticatedGuard, CurrentUser, LoginGuard, OIDC_CLIENT, User } from '../auth/index.js';
import { ProviderService } from '../outbound/provider.service.js';
import { ApiOkResponsePaginated, PaginatedResponseDto } from './paginated-data.response.js';
import { RedirectQueryParams } from './redirect.query.params.js';
import { PersonByIdParams } from '../../person/api/person-by-id.param.js';
import { PersonService } from '../outbound/person.service.js';
import { PersonendatensatzResponse } from '../../person/api/personendatensatz.response.js';
import { ServiceProviderInfoResponse } from '../../rolle/api/service-provider-info.response.js';
import { CreatePersonBodyParams } from '../../person/api/create-person.body.params.js';
import { PersonenQueryParams } from '../../person/api/personen-query.param.js';

@ApiTags('frontend')
@Controller({ path: 'frontend' })
export class FrontendController {
    private readonly logger: Logger = new Logger(FrontendController.name);

    private readonly defaultLoginRedirect: string;

    private readonly logoutRedirect: string;

    public constructor(
        configService: ConfigService<ServerConfig>,
        @Inject(OIDC_CLIENT) private client: Client,
        private providerService: ProviderService,
        private personService: PersonService,
    ) {
        const frontendConfig: FrontendConfig = configService.getOrThrow<FrontendConfig>('FRONTEND');
        this.defaultLoginRedirect = frontendConfig.DEFAULT_LOGIN_REDIRECT;
        this.logoutRedirect = frontendConfig.LOGOUT_REDIRECT;
    }

    @UseGuards(LoginGuard)
    @Get('login')
    @ApiOperation({ summary: 'Used to start OIDC authentication.' })
    @ApiResponse({ status: 302, description: 'Redirection to orchestrate OIDC flow.' })
    @ApiQuery({ type: RedirectQueryParams })
    public login(@Res() res: Response, @Session() session: SessionData): void {
        const target: string = session.redirectUrl ?? this.defaultLoginRedirect;
        session.redirectUrl = undefined;
        res.redirect(target);
    }

    @Get('logout')
    @ApiOperation({ summary: 'Used to log out the current user.' })
    @ApiResponse({ status: 302, description: 'Redirect to logout.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while trying to log out.' })
    public logout(@Req() req: Request, @Res() res: Response): void {
        const user: User | undefined = req.user as User | undefined;
        const idToken: string | undefined = user?.id_token;

        req.logout((logoutErr?: Error) => {
            if (logoutErr) {
                // Error should not stop logout process
                this.logger.log('An error occurres while trying to log out', logoutErr);
            }

            req.session.destroy((destroyErr?: Error) => {
                if (destroyErr) {
                    // Error should not stop logout process
                    this.logger.log('An error occurred while trying to destroy the session', destroyErr);
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
    @UseGuards(AuthenticatedGuard)
    @ApiOperation({ summary: 'Info about logged in user.' })
    @ApiUnauthorizedResponse({ description: 'User is not logged in.' })
    @ApiOkResponse({ description: 'Returns info about the logged in user.' })
    public info(@CurrentUser() user: User): UserinfoResponse {
        return user.userinfo;
    }

    @Get('provider')
    @UseGuards(AuthenticatedGuard)
    @ApiOperation({ summary: 'Providers the user has access to.' })
    @ApiUnauthorizedResponse({ description: 'User is not logged in.' })
    @ApiOkResponse({ description: 'Returns the providers for the current user.', type: [ServiceProviderInfoResponse] })
    public provider(@CurrentUser() user: User): Promise<GetServiceProviderInfoDo[]> {
        return this.providerService.listProviders(user);
    }

    @Get('personen')
    @UseGuards(AuthenticatedGuard)
    @ApiOperation({ summary: 'Lists personen.' })
    @ApiUnauthorizedResponse({ description: 'User is not logged in.' })
    @ApiOkResponsePaginated(PersonendatensatzResponse, { description: 'Paginated list of Personen' })
    public persons(
        @Query() params: PersonenQueryParams,
        @CurrentUser() user: User,
    ): Promise<PaginatedResponseDto<PersonendatensatzResponse>> {
        return this.personService.getAllPersons(params, user);
    }

    @Post('personen')
    @UseGuards(AuthenticatedGuard)
    @ApiOperation({ summary: 'Creates a new person.' })
    @ApiUnauthorizedResponse({ description: 'User is not logged in.' })
    @ApiOkResponse({ description: 'Creates a new user', type: PersonendatensatzResponse })
    public createPerson(
        @Body() params: CreatePersonBodyParams,
        @CurrentUser() user: User,
    ): Promise<PersonendatensatzResponse> {
        return this.personService.createPerson(params, user);
    }

    @Patch('personen/:personId/password')
    @UseGuards(AuthenticatedGuard)
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiOperation({ summary: 'Resets the users password.' })
    @ApiAcceptedResponse({ description: 'Password for person was successfully reset.', type: String })
    @ApiNotFoundResponse({ description: 'The person does not exist.' })
    @ApiUnauthorizedResponse({ description: 'User is not logged in.' })
    public passwordReset(@Param() params: PersonByIdParams, @CurrentUser() user: User): Promise<string> {
        return this.personService.resetPassword(params.personId, user);
    }
}
