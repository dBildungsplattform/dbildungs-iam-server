import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { DetailedValidationError } from '../validation/detailed-validation.error.js';
import { ValidationError } from 'class-validator';
import { SchulConnexError } from './schulconnex.error.js';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { Response } from 'express';

@Catch(DetailedValidationError)
export class SchulConnexValidationErrorFilter implements ExceptionFilter<DetailedValidationError> {
    public catch(exception: DetailedValidationError, host: ArgumentsHost): void {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();
        const status: number = exception.getStatus();

        const schulConnexError: SchulConnexError = this.handleValidationErrors(exception, status);

        response.status(status).json({
            ...schulConnexError,
        });
    }

    private handleValidationErrors(validationError: DetailedValidationError, statusCode?: number): SchulConnexError {
        const validationErrors: ValidationError[] = validationError.validationErrors;
        const schulConnexError: SchulConnexError = {
            statusCode: statusCode ?? 400,
            subCode: '',
            title: '',
            description: '',
        };

        if (!validationErrors[0]) {
            schulConnexError.subCode = '00';
            schulConnexError.title = 'fehlerhafte Anfrage';
            schulConnexError.description = 'Die Anfrage ist fehlerhaft';
            return schulConnexError;
        }

        // handle the first validation error that was found
        const currentValidationError: ValidationError = this.getFirstValidationError(validationErrors[0]);

        if (currentValidationError.constraints) {
            const {
                property,
                errorCode: errorSubCode,
                errorMessage: errorDescription,
            }: {
                property: string;
                errorCode: string;
                errorMessage: { title: string; description: string };
            } = this.mapValidationErrorConstraints(currentValidationError);

            schulConnexError.subCode = errorSubCode;
            schulConnexError.title = errorDescription.title;
            schulConnexError.description = `${errorDescription.description} '${property}'`;
        }

        return schulConnexError;
    }

    private getFirstValidationError(validationError: ValidationError): ValidationError {
        let currentValidationError: ValidationError = validationError;

        while (currentValidationError?.children?.length && currentValidationError?.children[0]) {
            currentValidationError = currentValidationError.children[0];
        }

        return currentValidationError;
    }

    private mapValidationErrorConstraints(validationError: ValidationError): {
        property: string;
        errorCode: string;
        errorMessage: { title: string; description: string };
    } {
        const property: string = this.getPropertyPath(validationError);
        const errorCode: string = this.determineErrorCode(validationError);
        const errorMessage: { title: string; description: string } = this.getErrorMessage(errorCode);

        return { property, errorCode, errorMessage };
    }

    private getPropertyPath(validationError: ValidationError): string {
        let property: string = validationError.property;

        if (validationError?.children?.length && validationError?.children[0]) {
            const validationErrorChild: ValidationError = validationError.children[0];
            property = `${property}.${validationErrorChild.property}`;
        }

        return property;
    }

    private determineErrorCode(validationError: ValidationError): string {
        if (validationError.constraints?.['isMinLength']) {
            return '07';
        }

        if (validationError.constraints?.['isDate']) {
            return '09';
        }

        if (validationError.constraints?.['isEnum']) {
            return '10';
        }

        if (validationError.constraints?.['isMaxLength']) {
            return '15';
        }

        if (
            validationError.constraints?.['isString'] ||
            validationError.constraints?.['isNumber'] ||
            validationError.constraints?.['isBoolean'] ||
            validationError.constraints?.['isEmail'] ||
            validationError.constraints?.['isArray'] ||
            validationError.constraints?.['isNotEmpty']
        ) {
            return '03';
        }

        return '04';
    }

    private getErrorMessage(errorCode: string): { title: string; description: string } {
        switch (errorCode) {
            case '07':
                return {
                    title: 'Attributwerte haben eine ungültige Länge',
                    description: 'Textlänge des Attributs ist nicht valide',
                };

            case '09':
                return {
                    title: 'Datumsattribut hat einen ungültigen Wert',
                    description: 'Datumsformat des Attributs ist ungültig',
                };

            case '10':
                return {
                    title: 'Attributwerte entsprechen keinem der erwarteten Werte',
                    description: 'Attribute müssen gültige Werte enthalten',
                };

            case '15':
                return {
                    title: 'Text ist zu lang',
                    description: 'Die Länge des übergebenen Texts überschreitet die Maximallänge',
                };

            case '03':
                return {
                    title: 'Validierungsfehler',
                    description: 'Die Anfrage konnte aufgrund ungültiger Eingabe nicht erfolgreich validiert werden',
                };

            default:
                return {
                    title: 'JSON-Struktur ist ungültig',
                    description: 'Der Payload entspricht keiner gültigen JSON-Struktur.',
                };
        }
    }
}
