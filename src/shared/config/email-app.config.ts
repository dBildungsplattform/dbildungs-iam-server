import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { HostConfig } from './host.config.js';
import { LoggingConfig } from './logging.config.js';
import { DbConfig } from './db.config.js';

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
}
