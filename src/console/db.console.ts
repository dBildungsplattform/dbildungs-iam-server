import { Command, CommandRunner } from 'nest-commander';
import { ClassLogger } from '../core/logging/class-logger.js';
import { DbInitConsole } from './db-init.console.js';
import { DbSeedConsole } from './dbseed/db-seed.console.js';

@Command({
    name: 'db',
    arguments: '<sub-command>',
    description: 'runs commands to manage the database',
    subCommands: [DbInitConsole, DbSeedConsole],
})
export class DbConsole extends CommandRunner {
    public constructor(private readonly logger: ClassLogger) {
        super();
    }

    public override run(_passedParams: string[], _options?: Record<string, unknown>): Promise<void> {
        this.logger.info('Did you forget the sub command?');
        return Promise.resolve();
    }
}
