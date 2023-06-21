/* eslint-disable no-console */
import { CommandFactory } from 'nest-commander';
import { CommandModule } from './command.module.js';

async function bootstrap(): Promise<void> {
    await CommandFactory.run(CommandModule, ['warn']);
}

bootstrap().catch((error) => console.error('Failed to run command with error: ', error));
