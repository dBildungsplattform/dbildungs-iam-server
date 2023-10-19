import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { Injectable } from '@nestjs/common';
import { LoginService } from '../ui-backend/domain/login.service.js';

@Injectable()
export class KeycloakHealthIndictor extends HealthIndicator {
    public constructor(private loginService: LoginService) {
        super();
    }

    public async check(): Promise<HealthIndicatorResult> {
        const HealthCheckKey: string = 'Keycloak';

        try {
            await this.loginService.createKcClient();

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
