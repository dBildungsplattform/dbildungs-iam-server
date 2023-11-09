import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { DetailedValidationError } from '../validation/detailed-validation.error.js';
import { ValidationError } from 'class-validator';

export class SchulConnexValidationErrorFilter implements ExceptionFilter<DetailedValidationError> {
    public catch(exception: DetailedValidationError, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        // should call the handler to handle validation errors
        const validationErrors: ValidationError[] = exception.validationErrors;

        response.status(400).json({
            statusCode: 400,
            ...validationErrors,
        });
    }

    // TODO: should create a handler to handle validation errors
}
