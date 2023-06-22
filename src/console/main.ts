/* eslint-disable no-console */
import { CommandFactory } from 'nest-commander';
import { ConsoleModule } from './console.module.js';

async function bootstrap(): Promise<void> {
    await CommandFactory.run(ConsoleModule, ['warn']);
}

bootstrap().catch((error) => console.error('Failed to run command with error: ', error));
