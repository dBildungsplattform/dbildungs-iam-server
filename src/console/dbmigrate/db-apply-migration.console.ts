import { MikroORM } from '@mikro-orm/core';
import { CommandRunner, SubCommand } from 'nest-commander';
import { Migrator } from '@mikro-orm/migrations';
import { ClassLogger } from '../../core/logging/class-logger.js';

@SubCommand({ name: 'migration-apply', description: 'applies latest migration version to database' })
export class DbApplyMigrationConsole extends CommandRunner {
    public constructor(
        private readonly orm: MikroORM,
        private readonly logger: ClassLogger,
    ) {
        super();
    }

    public override async run(_passedParams: string[], _options?: Record<string, unknown>): Promise<void> {
        this.logger.info('Migrating to latest version...');
        const migrator: Migrator = this.orm.getMigrator();
        await migrator.up();
        this.logger.info('Finished migration to latest version.');
    }
}
