import { MikroORM } from '@mikro-orm/core';
import { CommandRunner, SubCommand } from 'nest-commander';
import { Migrator } from '@mikro-orm/migrations';
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
        const migrator: Migrator = this.orm.getMigrator();
        await migrator.createMigration();
        this.logger.info('Finished creation of new migration.');
    }
}
