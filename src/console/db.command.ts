import { Command, CommandRunner } from 'nest-commander';
import { DbInitCommand } from './db-init.command.js';
import { LoggerService } from '../shared/index.js';

@Command({
    name: 'db',
    arguments: '<sub-command>',
    description: 'Runs commands to manage the database.',
    subCommands: [DbInitCommand],
})
export class DbCommand extends CommandRunner {
    public constructor(private readonly logger: LoggerService) {
        super();
    }

    public override run(_passedParams: string[], _options?: Record<string, unknown>): Promise<void> {
        this.logger.info('Did you forget the sub command?');
        return Promise.resolve();
    }
}
