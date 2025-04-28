import { Inject, Injectable, Scope } from '@nestjs/common';
import { ModuleLogger } from './module-logger.js';
import { Logger as LoggerWinston } from 'winston';
import { Logger } from './logger.js';
import { INQUIRER } from '@nestjs/core';
import { inspect } from 'util';

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
     * Logs the message with log-level error, then either logs the content of the parameter 'error' by calling util.inspect on it, if
     * its type is not Error, or
     * logs the message and stack contained in the parameter 'error', if its type is Error.
     * @param message
     * @param error should implement Error interface
     */
    public logUnknownAsError(message: string, error: unknown, warnWhenErrorIsUndefined: boolean = true): void {
        if (this.instanceOfError(error, warnWhenErrorIsUndefined)) {
            this.error(message + ' - ' + error.message, error.stack);
        } else {
            this.error(message + ' - ' + inspect(error, false, 2, false), undefined);
        }
    }

    /**
     * Checks for any object, whether its type is Error based on existence of the attributes 'name' and 'message' from Error-interface.
     * Note that 'stack' is an optional attribute in that interface and therefore can be UNDEFINED.
     * Implemented as method, not a function, so two separate failures can be handled and logged internally accordingly.
     * @param object
     * @private only used in the ClassLogger
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private instanceOfError(object: any, warnWhenErrorIsUndefined: boolean): object is Error {
        if (object === undefined && warnWhenErrorIsUndefined) {
            const error: Error = new Error('Parameter was UNDEFINED when calling instanceOfError');
            this.warning(error.message, error.stack);

            return false;
        }
        if (typeof object === 'string') {
            const error: Error = new Error(
                'Type of parameter was String when calling instanceOfError, that may not have been intentional',
            );
            this.warning(error.message, error.stack);

            return false;
        }

        return object instanceof Error; //instanceof-check for Error succeeds because its object as well as interface
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
