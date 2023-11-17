import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { DetailedValidationError } from '../validation/detailed-validation.error.js';
import { ValidationError } from 'class-validator';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { Response } from 'express';

export type SchulConnexError = {
    statusCode: number;
    subCode: string;
    title: string;
    description: string;
};

@Catch(DetailedValidationError)
export class SchulConnexValidationErrorFilter implements ExceptionFilter<DetailedValidationError> {
    public catch(exception: DetailedValidationError, host: ArgumentsHost): void {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();
        const status: number = exception.getStatus();

        const schulConnexError: SchulConnexError = this.handleValidationErrors(exception, status);

        response.status(status);
        response.json(schulConnexError);
    }

    private handleValidationErrors(
        validationError: DetailedValidationError,
        statusCode: number = 400,
    ): SchulConnexError {
        const validationErrors: ValidationError[] = validationError.validationErrors;
        let schulConnexError: SchulConnexError = {
            statusCode: statusCode,
            subCode: '00',
            title: 'Fehlerhafte Anfrage',
            description: 'Die Anfrage ist fehlerhaft',
        };

        if (!validationErrors[0]) {
            return schulConnexError;
        }

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

            schulConnexError = {
                statusCode: statusCode,
                subCode: errorSubCode,
                title: errorDescription.title,
                description: `${errorDescription.description} '${property}'`,
            };
            return schulConnexError;
        }
        return schulConnexError;
    }

    private getFirstValidationError(validationError: ValidationError): ValidationError {
        let currentValidationError: ValidationError = validationError;

        if (currentValidationError?.children?.length && currentValidationError?.children[0]) {
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

        return '03';
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

            // default case is '03'
            default:
                return {
                    title: 'Validierungsfehler',
                    description: 'Die Anfrage konnte aufgrund ungültiger Eingabe nicht erfolgreich validiert werden',
                };
        }
    }
}
