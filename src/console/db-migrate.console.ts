import { MikroORM } from '@mikro-orm/core';
import { CommandRunner, SubCommand } from 'nest-commander';
import { ClassLogger } from '../core/logging/class-logger.js';
import { Migrator } from '@mikro-orm/migrations';

@SubCommand({ name: 'migrate', description: 'creates a new or initial migration for the database' })
export class DbMigrateConsole extends CommandRunner {
    private static readonly InitParameter: string = 'init';

    private static readonly UpParameter: string = 'up';

    public constructor(
        private readonly orm: MikroORM,
        private readonly logger: ClassLogger,
    ) {
        super();
    }

    public override async run(_passedParams: string[], _options?: Record<string, unknown>): Promise<void> {
        if (_passedParams[0]) {
            if (
                _passedParams[0] !== DbMigrateConsole.InitParameter &&
                _passedParams[0] !== DbMigrateConsole.UpParameter
            ) {
                const err: Error = new Error(`Unknown parameter ${_passedParams[0]} for migration`);
                this.logger.error(String(err));
                throw err;
            }
            if (_passedParams[0] === DbMigrateConsole.UpParameter) {
                this.logger.info('Migrating to latest version...');
                const migrator: Migrator = this.orm.getMigrator();
                await migrator.up();
                this.logger.info('Finished migration to latest version.');
                return;
            }
            if (_passedParams[0] === DbMigrateConsole.InitParameter) {
                this.logger.info('Creating initial migration...');
                const migrator: Migrator = this.orm.getMigrator();
                await migrator.createInitialMigration();
                this.logger.info('Finished creation of initial migration.');
                return;
            }
        } else {
            this.logger.info('Creating new migration...');
            const migrator: Migrator = this.orm.getMigrator();
            await migrator.createMigration();
            this.logger.info('Finished creation of new migration.');
        }
    }
}
