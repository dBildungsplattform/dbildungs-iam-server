import { Injectable } from '@nestjs/common';
import { BaseClient, Client, errors, Issuer, TokenSet } from 'openid-client';
import { KeycloakClientError } from '../../../shared/error/index.js';
import { UserAuthenticationFailedError } from '../../../shared/error/user-authentication-failed.error.js';
import { KeycloakConfig } from '../../../shared/config/index.js';
import { ConfigService } from '@nestjs/config';
import OPError = errors.OPError;

@Injectable()
export class LoginService {
    private kcConfig: KeycloakConfig;

    public constructor(private readonly config: ConfigService) {
        this.kcConfig = this.config.getOrThrow<KeycloakConfig>('KEYCLOAK');
    }

    public async getTokenForUser(username: string, password: string): Promise<TokenSet> {
        try {
            const client = await this.createKcClient();
            return await client.grant({
                grant_type: 'password',
                username: username,
                password: password,
            });
        } catch (e) {
            if (e instanceof OPError && e.error === 'invalid_grant') {
                throw new UserAuthenticationFailedError('User could not be authenticated successfully.');
            }
            throw new KeycloakClientError('KeyCloak service did not respond.');
        }
    }

    public async createKcClient(): Promise<BaseClient> {
        const keycloakIssuer: Issuer = await Issuer.discover(
            this.kcConfig.BASE_URL + '/realms/' + this.kcConfig.REALM_NAME,
        );
        const client: Client = new keycloakIssuer.Client({
            client_id: this.kcConfig.CLIENT_ID,
            client_secret: this.kcConfig.CLIENT_SECRET,
            token_endpoint_auth_method: 'client_secret_basic',
        });
        return client;
    }
}
