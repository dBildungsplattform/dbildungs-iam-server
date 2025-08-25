import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { HostConfig } from './host.config.js';
import { KeycloakConfig } from './keycloak.config.js';
import { LoggingConfig } from './logging.config.js';

export class EmailAppConfig {
    @ValidateNested()
    @Type(() => HostConfig)
    public readonly HOST!: HostConfig;

    @ValidateNested()
    @Type(() => KeycloakConfig)
    public readonly KEYCLOAK!: KeycloakConfig;

    @ValidateNested()
    @Type(() => LoggingConfig)
    public readonly LOGGING!: LoggingConfig;
}
