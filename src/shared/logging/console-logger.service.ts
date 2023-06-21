/* eslint-disable no-console */
import { LoggerService } from './logger.service.js';

export class ConsoleLoggerService extends LoggerService {
    public override trace(message: string): void {
        console.trace(message);
    }

    public override debug(message: string): void {
        console.debug(message);
    }

    public override log(message: string): void {
        console.log(message);
    }

    public override info(message: string): void {
        console.info(message);
    }

    public override warn(message: string): void {
        console.warn(message);
    }

    public override error(message: string): void {
        console.error(message);
    }
}
