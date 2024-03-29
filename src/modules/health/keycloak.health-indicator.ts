import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { Injectable } from '@nestjs/common';
import { tryGetClient } from '../authentication/services/oidc-client.service.js';
import { KeycloakInstanceConfig } from '../keycloak-administration/keycloak-instance-config.js';

@Injectable()
export class KeycloakHealthIndicator extends HealthIndicator {
    public constructor(private config: KeycloakInstanceConfig) {
        super();
    }

    public async check(): Promise<HealthIndicatorResult> {
        const HealthCheckKey: string = 'Keycloak';

        try {
            await tryGetClient(this.config);

            return super.getStatus(HealthCheckKey, true);
        } catch (e: unknown) {
            let statusMessage: string;
            if (e instanceof Error) {
                statusMessage = `Keycloak does not seem to be up: ${e.message}`;
            } else {
                statusMessage = `Keycloak does not seem to be up and there is no error message available`;
            }
            return super.getStatus(HealthCheckKey, false, { message: statusMessage });
        }
    }
}
