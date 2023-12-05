import { DriverException } from '@mikro-orm/core';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { AbstractHttpAdapter, HttpAdapterHost } from '@nestjs/core';
import util from 'util';
import { ClassLogger } from '../../core/logging/class-logger.js';
import { SchulConnexError } from './schul-connex.error.js';

const DB_ERROR: SchulConnexError = new SchulConnexError({
    titel: 'Interner Serverfehler',
    beschreibung: 'Es ist ein interner Fehler aufgetreten. Die Datenbank hat einen Fehler erzeugt.',
    code: HttpStatus.INTERNAL_SERVER_ERROR,
    subcode: '00',
});

const UNKNOWN_ERROR: SchulConnexError = new SchulConnexError({
    titel: 'Interner Serverfehler',
    beschreibung: 'Es ist ein interner Fehler aufgetreten. Der Fehler ist unbekannt.',
    code: HttpStatus.INTERNAL_SERVER_ERROR,
    subcode: '00',
});

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    public constructor(
        private readonly httpAdapterHost: HttpAdapterHost,
        private logger: ClassLogger,
    ) {}

    public catch(exception: unknown, host: ArgumentsHost): void {
        // In certain situations `httpAdapter` might not be available in the
        // constructor method, thus we should resolve it here.
        const { httpAdapter }: { httpAdapter: AbstractHttpAdapter } = this.httpAdapterHost;

        const ctx: HttpArgumentsHost = host.switchToHttp();

        if (exception instanceof Error) {
            if (exception instanceof HttpException) {
                httpAdapter.reply(ctx.getResponse(), exception.getResponse(), exception.getStatus());
            } else if (exception instanceof DriverException) {
                this.logger.crit(exception.message, exception.stack);

                httpAdapter.reply(ctx.getResponse(), DB_ERROR, DB_ERROR.code);
            } else {
                this.logger.alert(`UNEXPECTED EXCEPTION - no instance of known Error: ${util.inspect(exception)}`);

                httpAdapter.reply(ctx.getResponse(), UNKNOWN_ERROR, UNKNOWN_ERROR.code);
            }
        } else {
            this.logger.alert(`UNEXPECTED EXCEPTION - no instance of Error: ${util.inspect(exception)}`);

            httpAdapter.reply(ctx.getResponse(), UNKNOWN_ERROR, UNKNOWN_ERROR.code);
        }
    }
}
