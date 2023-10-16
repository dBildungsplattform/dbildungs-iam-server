import { Injectable } from '@nestjs/common';
import { Credentials, KeycloakAdminClient } from '@s3pweb/keycloak-admin-client-cjs';
import { ConfigService } from '@nestjs/config';
import { KeycloakConfig } from '../../../shared/config/index.js';
import { DomainError, UserAuthenticationFailedError } from '../../../shared/error/index.js';

@Injectable()
export class NewLoginService {
    private kcConfig: KeycloakConfig;

    public constructor(private readonly kcAdminClient: KeycloakAdminClient, private readonly config: ConfigService) {
        this.kcConfig = this.config.getOrThrow<KeycloakConfig>('KEYCLOAK');
        this.kcAdminClient.setConfig({
            baseUrl: this.kcConfig.BASE_URL,
            realmName: this.kcConfig.SCHULPORTAL_REALM_NAME,
        });
    }

    public async auth(username: string, password: string): Promise<Result<string, DomainError>> {
        try {
            const credentials: Credentials = {
                grantType: 'password',
                clientId: this.kcConfig.SCHULPORTAL_CLIENT_ID,
                username: username,
                password: password,
            };
            await this.kcAdminClient.auth(credentials);
            const accessToken: string | undefined = await this.kcAdminClient.getAccessToken();
            if (accessToken !== undefined) {
                return { ok: true, value: accessToken };
            } else {
                // kcAdminClient will throw an exception if credentials are wrong, not return undefined
                return {
                    ok: false,
                    error: new UserAuthenticationFailedError('User could not be authenticated successfully.'),
                };
            }
        } catch (err) {
            return {
                ok: false,
                error: new UserAuthenticationFailedError('User could not be authenticated successfully.'),
            };
        }
    }
}
