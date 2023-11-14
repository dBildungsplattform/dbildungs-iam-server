import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { AuthorizationParameters, Client, Strategy, StrategyOptions, TokenSet, UserinfoResponse } from 'openid-client';

import { FrontendConfig, ServerConfig } from '../../../shared/config/index.js';
import { OIDC_CLIENT } from './oidc-client.service.js';

@Injectable()
export class OpenIdConnectStrategy extends PassportStrategy(Strategy, 'oidc') {
    public constructor(
        @Inject(OIDC_CLIENT) private client: Client,
        configService: ConfigService<ServerConfig>,
    ) {
        const frontendConfig: FrontendConfig = configService.getOrThrow<FrontendConfig>('FRONTEND');

        super({
            client,
            usePKCE: true,
            params: { redirect_uri: frontendConfig.OIDC_CALLBACK_URL },
            passReqToCallback: false,
        } satisfies StrategyOptions);
    }

    public async validate(tokenset: TokenSet): Promise<AuthorizationParameters> {
        try {
            const userinfo: UserinfoResponse = await this.client.userinfo(tokenset);

            const idToken: string | undefined = tokenset.id_token;
            const accessToken: string | undefined = tokenset.access_token;
            const refreshToken: string | undefined = tokenset.refresh_token;

            const user: AuthorizationParameters = {
                id_token: idToken,
                access_token: accessToken,
                refresh_token: refreshToken,
                userinfo,
            };

            return user;
        } catch (err: unknown) {
            throw new UnauthorizedException();
        }
    }
}
