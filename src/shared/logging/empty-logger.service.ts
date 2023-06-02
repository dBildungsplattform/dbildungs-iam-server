import { LoggerService } from "./logger.service.js";

export class EmptyLoggerService extends LoggerService {
    public trace(_message: string): void {}

    public debug(_message: string): void {}

    public info(_message: string): void {}

    public warn(_message: string): void {}

    public error(_message: string): void {}
}
