import { Inject, Injectable, Scope } from '@nestjs/common';
import { ModuleLogger } from './module-logger.js';
import { Logger as LoggerWinston } from 'winston';
import { Logger } from './logger.js';
import { INQUIRER } from '@nestjs/core';
import { inspect } from 'util';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function instanceOfError(object: any): object is Error {
    if (object === undefined) return false;
    if (typeof object === 'string') return false;
    return 'name' in object && 'message' in object; // no existence-check for stack, because it is optional in Error and therefore can be undefined
}

@Injectable({ scope: Scope.TRANSIENT })
export class ClassLogger extends Logger {
    private logger: LoggerWinston;

    private readonly context: string | undefined;

    public constructor(
        moduleLogger: ModuleLogger,
        @Inject(INQUIRER) private parentClass: object,
    ) {
        super();
        this.logger = moduleLogger.getLogger();
        this.context = `${moduleLogger.moduleName}.${this.parentClass?.constructor?.name}`;
    }

    public emerg(message: string, trace?: unknown): void {
        this.logger.log('emerg', this.createMessage(message, trace));
    }

    public alert(message: string, trace?: unknown): void {
        this.logger.log('alert', this.createMessage(message, trace));
    }

    public crit(message: string, trace?: unknown): void {
        this.logger.log('crit', this.createMessage(message, trace));
    }

    public error(message: string, trace?: unknown): void {
        this.logger.log('error', this.createMessage(message, trace));
    }

    public warning(message: string, trace?: unknown): void {
        this.logger.log('warning', this.createMessage(message, trace));
    }

    public notice(message: string, trace?: unknown): void {
        this.logger.log('notice', this.createMessage(message, trace));
    }

    public info(message: string, trace?: unknown): void {
        this.logger.log('info', this.createMessage(message, trace));
    }

    public debug(message: string, trace?: unknown): void {
        this.logger.log('debug', this.createMessage(message, trace));
    }

    /**
     * Logs the message with log-level error, then either logs the content of the object 'error' by calling util.inspect on it, if
     * its type is not the Error type, or
     * logs the message and stack contained in the object 'error', if its type is Error type.
     * @param message
     * @param error
     */
    public logUnknownAsError(message: string, error: unknown): void {
        this.logger.log('error', message);
        if (instanceOfError(error)) {
            this.logger.log('error', `ERROR: msg:${error.message}, stack:${error.stack}`);
        } else {
            this.logger.log('error', inspect(error, false, 2, false));
        }
    }

    private createMessage(
        message: string,
        trace?: unknown,
    ): { message: string; context: string | undefined; trace?: unknown } {
        if (trace) {
            return { message, context: this.context, trace };
        }
        return { context: this.context, message };
    }
}
