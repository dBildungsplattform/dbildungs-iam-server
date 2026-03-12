import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { DetailedValidationError } from '../validation/detailed-validation.error.js';
import { ValidationError } from 'class-validator';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { Response } from 'express';
import { DbiamValidationError, ValidationErrorI18nTypes } from '../validation/dbiam-validation.error.js';

@Catch(DetailedValidationError)
export class ValidationExceptionFilter implements ExceptionFilter<DetailedValidationError> {
    public catch(exception: DetailedValidationError, host: ArgumentsHost): void {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();
        const status: number = exception.getStatus();

        const dbiamValidationError: DbiamValidationError = this.handleValidationErrors(exception, status);

        response.status(status);
        response.json(dbiamValidationError);
    }

    private handleValidationErrors(
        validationError: DetailedValidationError,
        statusCode: number, //default was 400, but method wasn't used elsewhere without statusCode provided
    ): DbiamValidationError {
        const validationErrors: ValidationError[] = validationError.validationErrors;
        let dbiamValidationError: DbiamValidationError = new DbiamValidationError({
            code: statusCode,
            i18nKey: ValidationErrorI18nTypes.VALIDATION_ERROR,
        });

        if (!validationErrors[0]) {
            return dbiamValidationError;
        }
        const currentValidationError: ValidationError = this.getFirstValidationError(validationErrors[0]);
        const i18nKey: ValidationErrorI18nTypes = this.mapConstraintToI18nKey(currentValidationError);

        dbiamValidationError = new DbiamValidationError({
            code: statusCode,
            i18nKey: i18nKey,
        });
        return dbiamValidationError;
    }

    private getFirstValidationError(validationError: ValidationError): ValidationError {
        let currentValidationError: ValidationError = validationError;

        if (currentValidationError?.children?.length && currentValidationError?.children[0]) {
            currentValidationError = currentValidationError.children[0];
        }

        return currentValidationError;
    }

    private mapConstraintToI18nKey(error: ValidationError): ValidationErrorI18nTypes {
        const constraints: string[] = Object.keys(error?.constraints ?? {});

        if (constraints.includes('isMaxLength') || constraints.includes('isMinLength')) {
            return ValidationErrorI18nTypes.INVALID_LENGTH;
        }
        if (constraints.includes('isDate')) {
            return ValidationErrorI18nTypes.INVALID_DATE;
        }
        if (constraints.includes('isEnum')) {
            return ValidationErrorI18nTypes.INVALID_ENUM;
        }
        if (constraints.includes('isNotEmpty')) {
            return ValidationErrorI18nTypes.REQUIRED;
        }

        return ValidationErrorI18nTypes.VALIDATION_ERROR;
    }
}
