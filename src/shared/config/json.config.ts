import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { DbConfig } from './db.config.js';
import { HostConfig } from './host.config.js';

export class JsonConfig {
    @ValidateNested()
    @Type(() => HostConfig)
    public readonly HOST!: HostConfig;

    @ValidateNested()
    @Type(() => DbConfig)
    public readonly DB!: DbConfig;
}
