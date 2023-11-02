import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { DbConfig } from './db.config.js';
import { FrontendConfig } from './frontend.config.js';
import { HostConfig } from './host.config.js';
import { KeycloakConfig } from './keycloak.config.js';
import { LoggingConfig } from './logging.config.js';
import { RedisConfig } from './redis.config.js';


export class JsonConfig {
    @ValidateNested()
    @Type(() => HostConfig)
    public readonly HOST!: HostConfig;

    @ValidateNested()
    @Type(() => FrontendConfig)
    public readonly FRONTEND!: FrontendConfig;

    @ValidateNested()
    @Type(() => DbConfig)
    public readonly DB!: DbConfig;

    @ValidateNested()
    @Type(() => KeycloakConfig)
    public readonly KEYCLOAK!: KeycloakConfig;

    @ValidateNested()
    @Type(() => LoggingConfig)
    public readonly LOGGING!: LoggingConfig;

    @ValidateNested()
    @Type(() => RedisConfig)
    public readonly REDIS!: RedisConfig;
}
