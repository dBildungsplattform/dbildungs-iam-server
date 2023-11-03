import { FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, Issuer } from 'openid-client';

import { KeycloakConfig, ServerConfig } from '../../../shared/config/index.js';

export const OIDC_CLIENT: symbol = Symbol();

export const OIDCClientProvider: FactoryProvider<Client> = {
    provide: OIDC_CLIENT,
    async useFactory(configService: ConfigService<ServerConfig>) {
        const keycloakConfig: KeycloakConfig = configService.getOrThrow<KeycloakConfig>('KEYCLOAK');

        const TrustIssuer: Issuer = await Issuer.discover(
            `${keycloakConfig.BASE_URL}/realms/${keycloakConfig.REALM_NAME}`,
        );

        const client: Client = new TrustIssuer.Client({
            client_id: keycloakConfig.CLIENT_ID,
            client_secret: keycloakConfig.CLIENT_SECRET,
        });

        return client;
    },
    inject: [ConfigService],
};
