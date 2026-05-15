import { IMigrator, MikroORM } from '@mikro-orm/core';
import { CommandRunner, SubCommand } from 'nest-commander';
import { ClassLogger } from '../../core/logging/class-logger.js';

@SubCommand({ name: 'migration-create', description: 'creates a new migration for the database' })
export class DbCreateMigrationConsole extends CommandRunner {
    public constructor(
        private readonly orm: MikroORM,
        private readonly logger: ClassLogger,
    ) {
        super();
    }

    public override async run(_passedParams: string[], _options?: Record<string, unknown>): Promise<void> {
        this.logger.info('Creating new migration...');
        const migrator: IMigrator = this.orm.migrator;
        await migrator.create();
        this.logger.info('Finished creation of new migration.');
    }
}
