/* eslint-disable no-console */
import { CommandFactory } from 'nest-commander';
import { ConsoleModule } from './console.module.js';

async function bootstrap(): Promise<void> {
    await CommandFactory.run(ConsoleModule, {
        logger: ['warn'],
        errorHandler: (_err: Error) => {
            console.error(_err);
            process.exit(1);
        },
        serviceErrorHandler: (_err: Error) => {
            console.error(_err);
            process.exit(1);
        },
    });
}

void bootstrap();
