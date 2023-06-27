import { MikroORM } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { CommandRunner, SubCommand } from 'nest-commander';
import { DbConfig, ServerConfig } from '../shared/config/index.js';
import { LoggerService } from '../shared/logging/index.js';

@SubCommand({ name: 'init', description: 'initializes the database' })
export class DbInitConsole extends CommandRunner {
    public constructor(
        private readonly orm: MikroORM,
        private readonly configService: ConfigService<ServerConfig, true>,
        private readonly logger: LoggerService,
    ) {
        super();
    }

    public override async run(_passedParams: string[], _options?: Record<string, unknown>): Promise<void> {
        this.logger.info('Initializing database...');
        await this.orm.getSchemaGenerator().createDatabase(this.configService.getOrThrow<DbConfig>('DB').DB_NAME);
        await this.orm.getSchemaGenerator().createSchema();
        this.logger.info('Initialized database');
    }
}
