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

        const schulConnexError: SchulConnexError = this.handleValidationErrors(exception);

        response.status(status).json({
            statusCode: status,
            ...schulConnexError,
        });
    }

    private handleValidationErrors(validationError: DetailedValidationError): Omit<SchulConnexError, 'statusCode'> {
        const validationErrors: ValidationError[] = validationError.validationErrors;

        if (!validationErrors[0]) {
            return {
                subCode: '00',
                title: 'fehlerhafte Anfrage',
                description: 'Die Anfrage ist fehlerhaft',
            };
        }

        // handle the first validation error that was found
        let currentValidationError: ValidationError = validationErrors[0];
        let property: string = currentValidationError.property;

        while (currentValidationError?.children?.length && currentValidationError?.children[0]) {
            currentValidationError = currentValidationError.children[0];
            property = `${property}.${currentValidationError.property}`;
        }

        if (currentValidationError.constraints) {
            if (currentValidationError.constraints['isNotEmpty']) {
                return {
                    subCode: '01',
                    title: 'fehlende Eingabe',
                    description: `Die Eingabe für '${property}' darf nicht leer sein`,
                };
            }

            if (
                currentValidationError.constraints['isMaxLength'] ||
                currentValidationError.constraints['isMinLength']
            ) {
                return {
                    subCode: '07',
                    title: 'Attributwerte haben eine ungültige Länge',
                    description: `Textlänge von Attribut '${property}' ist nicht valide`,
                };
            }

            if (currentValidationError.constraints['isDate']) {
                return {
                    subCode: '09',
                    title: 'Datumsattribut hat einen ungültigen Wert',
                    description: ` Datumsformat von Attribut '${property}' ist ungültig`,
                };
            }

            if (currentValidationError.constraints['isEnum']) {
                return {
                    subCode: '10',
                    title: 'Attributwerte entspricht keinem der erwarteten Werte',
                    description: `Attibute '${property}' muss einen gültigen Wert aus der Werteliste enthalten`,
                };
            }

            if (currentValidationError.constraints['isMaxLength']) {
                return {
                    subCode: '15',
                    title: 'Text ist zu lang',
                    description: `Die Länge des übergebenen '${property}' überschreitet die in der Spezifikation angegebene Maximallänge.`,
                };
            }

            if (
                currentValidationError.constraints['isString'] ||
                currentValidationError.constraints['isNumber'] ||
                currentValidationError.constraints['isBoolean'] ||
                currentValidationError.constraints['isEmail'] ||
                currentValidationError.constraints['isArray'] ||
                currentValidationError.constraints['isNotEmpty']
            ) {
                return {
                    subCode: '03',
                    title: 'Validierungsfehler',
                    description: `Die Anfrage konnte aufgrund invalider Eingabe für '${property}' nicht erfolgreich validiert werden `,
                };
            }
        }
    }
}
