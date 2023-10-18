import { ExceptionFilter, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainError } from '../../../shared/error/index.js';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';

export class UiBackendExceptionFilter<R extends DomainError> implements ExceptionFilter<R> {
    public constructor(private httpStatusCode: HttpStatus) {}

    public catch(exception: R, host: ArgumentsHost): void {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();
        const request: Request = ctx.getRequest<Request>();

        response.status(this.httpStatusCode).json({
            code: exception.code,
            message: exception.message,
            path: request.url,
        });
    }
}
