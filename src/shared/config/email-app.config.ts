import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { HostConfig } from './host.config.js';
import { LoggingConfig } from './logging.config.js';
import { DbConfig } from './db.config.js';
import { LdapConfig } from './ldap.config.js';
import { OxConfig } from './ox.config.js';

export class EmailAppConfig {
    @ValidateNested()
    @Type(() => HostConfig)
    public readonly HOST!: HostConfig;

    @ValidateNested()
    @Type(() => LoggingConfig)
    public readonly LOGGING!: LoggingConfig;

    @ValidateNested()
    @Type(() => DbConfig)
    public readonly DB!: DbConfig;

    @ValidateNested()
    @Type(() => LdapConfig)
    public readonly LDAP!: LdapConfig;

    @ValidateNested()
    @Type(() => OxConfig)
    public readonly OX!: OxConfig;
}
