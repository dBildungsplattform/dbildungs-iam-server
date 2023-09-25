import {ExceptionFilter, ArgumentsHost, HttpStatus} from '@nestjs/common';
import { Request, Response } from 'express';
import {DomainError} from "../../../shared/error/index.js";

export class UiBackendExceptionFilter<R extends DomainError> implements ExceptionFilter<R> {

    constructor(private httpStatusCode: HttpStatus) {
    }
    catch(exception: R, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        response
            .status(this.httpStatusCode)
            .json({
                code: exception.code,
                message: exception.message,
                path: request.url
            });
    }
}
