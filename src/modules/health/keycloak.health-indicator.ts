import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { tryGetClient } from '../frontend/auth/index.js';
import { ServerConfig } from '../../shared/config/index.js';

@Injectable()
export class KeycloakHealthIndicator extends HealthIndicator {
    public constructor(private configService: ConfigService<ServerConfig>) {
        super();
    }

    public async check(): Promise<HealthIndicatorResult> {
        const HealthCheckKey: string = 'Keycloak';

        try {
            await tryGetClient(this.configService);

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
