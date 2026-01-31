import { Injectable, LoggerService } from '@nestjs/common';
import util from 'util';
import { ModuleLogger } from './module-logger.js';
import { Logger } from 'winston';

/**
 * Necessary for nest internal logging. Nest expects an implementation of LoggerService i.e. the method warn() instead of warning()
 */
@Injectable()
export class NestLogger implements LoggerService {
    public constructor(private readonly moduleLogger: ModuleLogger) {}

    public log(message: unknown): void {
        this.moduleLogger.getLogger().log('notice', this.stringifiedMessage(message));
    }

    public error(message: unknown): void {
        this.moduleLogger.getLogger().error(this.stringifiedMessage(message));
    }

    public warn(message: unknown): void {
        this.moduleLogger.getLogger().log('warning', this.stringifiedMessage(message));
    }

    public verbose?(message: unknown): void {
        this.moduleLogger.getLogger().info(this.stringifiedMessage(message));
    }

    public debug?(message: unknown): void {
        const logger: Logger = this.moduleLogger.getLogger();
        logger.debug(this.stringifiedMessage(message));
    }

    private stringifiedMessage(message: unknown): string {
        return util.inspect(message).replace(/\n/g, '').replace(/\\n/g, '');
    }
}
