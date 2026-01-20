import { Injectable } from '@nestjs/common';
import { Credentials, KeycloakAdminClient } from '@s3pweb/keycloak-admin-client-cjs';

import { DomainError, KeycloakClientError } from '../../../shared/error/index.js';
import { KeycloakInstanceConfig } from '../keycloak-instance-config.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';

@Injectable()
export class KeycloakAdministrationService {
    private static AUTHORIZATION_TIMEBOX_MS: number = 59 * 1000;

    private lastAuthorizationTime: number = 0;

    public constructor(
        private readonly kcAdminClient: KeycloakAdminClient,
        private readonly kcConfig: KeycloakInstanceConfig,
        private readonly logger: ClassLogger,
    ) {
        this.kcAdminClient.setConfig({
            baseUrl: this.kcConfig.BASE_URL,
            realmName: this.kcConfig.ADMIN_REALM_NAME,
        });
    }

    public async getAuthedKcAdminClient(): Promise<Result<KeycloakAdminClient, DomainError>> {
        const authResult: Result<void, DomainError> = await this.authIfNeeded();

        if (!authResult.ok) {
            return authResult;
        }

        return { ok: true, value: this.kcAdminClient };
    }

    public resetLastAuthorizationTime(): void {
        this.lastAuthorizationTime = 0;
    }

    private async authIfNeeded(): Promise<Result<void, DomainError>> {
        const now: number = Date.now();
        const elapsedTimeMilliseconds: number = now - this.lastAuthorizationTime;
        const shouldAuth: boolean = elapsedTimeMilliseconds > KeycloakAdministrationService.AUTHORIZATION_TIMEBOX_MS;

        if (shouldAuth) {
            try {
                const credentials: Credentials = {
                    grantType: 'client_credentials',
                    clientId: this.kcConfig.ADMIN_CLIENT_ID,
                    clientSecret: this.kcConfig.ADMIN_SECRET,
                };
                await this.kcAdminClient.auth(credentials);
            } catch (err) {
                this.logger.logUnknownAsError('Could not authorize with Keycloak', err);
                return { ok: false, error: new KeycloakClientError('Could not authorize with Keycloak') };
            }

            this.lastAuthorizationTime = now;
        }

        return { ok: true, value: undefined };
    }
}
