import { MikroORM, UmzugMigration } from '@mikro-orm/core';
import { CommandRunner, SubCommand, Option } from 'nest-commander';
import { Migrator } from '@mikro-orm/migrations';
import { ClassLogger } from '../../core/logging/class-logger.js';

enum MigrationType {
    STRUCTURAL = 'structural',
    DATA = 'data',
    All = 'all',
}

@SubCommand({ name: 'migration-apply', description: 'applies latest migration version to database' })
export class DbApplyMigrationConsole extends CommandRunner {
    public constructor(
        private readonly orm: MikroORM,
        private readonly logger: ClassLogger,
    ) {
        super();
    }

    public override async run(_passedParams: string[], options?: Record<string, unknown>): Promise<void> {
        this.logger.info('Migrating to latest version...');
        const migrator: Migrator = this.orm.getMigrator();
        const migrationType: MigrationType = (options?.['migration'] as MigrationType) || MigrationType.All;

        let allMigrations: UmzugMigration[] = await migrator.getPendingMigrations();

        //sort migrations by filename after removing the 'S' or 'D' prefix
        allMigrations = allMigrations.sort((a: UmzugMigration, b: UmzugMigration) => {
            const aName: string = a.name.substring(1);
            const bName: string = b.name.substring(1);
            return aName.localeCompare(bName);
        });

        const migrationsToExecute: UmzugMigration[] = allMigrations.filter((migration: UmzugMigration) => {
            if (migrationType === MigrationType.All) {
                return true;
            }

            if (migrationType === MigrationType.STRUCTURAL) {
                return migration.name.startsWith('S');
            }

            return migration.name.startsWith('D');
        });

        await migrator.up(migrationsToExecute.map((migration: UmzugMigration) => migration.name));
        this.logger.info('Finished migration to latest version.');
    }

    @Option({
        flags: '-m, --migration [migration]',
        description: 'The migrations to apply',
    })
    public parseMigrationOption(val: string): MigrationType {
        switch (val) {
            case 'structural':
                return MigrationType.STRUCTURAL;
            case 'data':
                return MigrationType.DATA;
            default:
                return MigrationType.All;
        }
    }
}
