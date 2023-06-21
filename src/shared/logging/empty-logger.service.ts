import { LoggerService } from './logger.service.js';

export class EmptyLoggerService extends LoggerService {
    public override trace(_message: string): void {}

    public override debug(_message: string): void {}

    public override log(_message: string): void {}

    public override info(_message: string): void {}

    public override warn(_message: string): void {}

    public override error(_message: string): void {}
}
