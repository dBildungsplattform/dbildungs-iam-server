import { LoggerService } from "./logger.service.js";

export class ConsoleLoggerService extends LoggerService {
    public trace(message: string): void {
        console.trace(message);
    }

    public debug(message: string): void {
        console.debug(message);
    }

    public info(message: string): void {
        console.info(message);
    }

    public warn(message: string): void {
        console.warn(message);
    }

    public error(message: string): void {
        console.error(message);
    }
}
