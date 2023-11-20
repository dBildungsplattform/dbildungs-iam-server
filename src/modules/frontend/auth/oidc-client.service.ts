import { FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseClient, Client, Issuer } from 'openid-client';

import { KeycloakConfig, ServerConfig } from '../../../shared/config/index.js';

export const OIDC_CLIENT: symbol = Symbol();

export async function tryGetClient(configService: ConfigService<ServerConfig>): Promise<BaseClient> {
    const keycloakConfig: KeycloakConfig = configService.getOrThrow<KeycloakConfig>('KEYCLOAK');

    const TrustIssuer: Issuer = await Issuer.discover(`${keycloakConfig.BASE_URL}/realms/${keycloakConfig.REALM_NAME}`);

    return new TrustIssuer.Client({
        client_id: keycloakConfig.CLIENT_ID,
        client_secret: keycloakConfig.CLIENT_SECRET,
    });
}

export const OIDCClientProvider: FactoryProvider<Client> = {
    provide: OIDC_CLIENT,
    async useFactory(configService: ConfigService<ServerConfig>) {
        return tryGetClient(configService);
    },
    inject: [ConfigService],
};
