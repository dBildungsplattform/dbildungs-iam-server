import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { DetailedValidationError } from '../validation/detailed-validation.error.js';
import { ValidationError } from 'class-validator';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { Response } from 'express';
import { SchulConnexError } from './schul-connex.error.js';


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
        let schulConnexError: SchulConnexError = new SchulConnexError({
            code: statusCode,
            subcode: '00',
            titel: 'Fehlerhafte Anfrage',
            beschreibung: 'Die Anfrage ist fehlerhaft',
        });

        if (!validationErrors[0]) {
            return schulConnexError;
        }

        const currentValidationError: ValidationError = this.getFirstValidationError(validationErrors[0]);

        if (currentValidationError.constraints) {
            const {
                property,
                detailedSchulConnexError,
            }: {
                property: string;
                detailedSchulConnexError: { subCode: string; title: string; description: string };
            } = this.mapValidationErrorConstraints(currentValidationError);

            schulConnexError = new SchulConnexError( {
                code: statusCode,
                subcode: detailedSchulConnexError.subCode,
                titel: detailedSchulConnexError.title,
                beschreibung: `${detailedSchulConnexError.description} '${property}'`,
            });
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
        detailedSchulConnexError: { subCode: string; title: string; description: string };
    } {
        const property: string = this.getPropertyPath(validationError);
        const schulConnexError: { subCode: string; title: string; description: string } =
            this.determineSchulConnexError(validationError);

        return { property, detailedSchulConnexError: schulConnexError };
    }

    private getPropertyPath(validationError: ValidationError): string {
        let property: string = validationError.property;

        if (validationError?.children?.length && validationError?.children[0]) {
            const validationErrorChild: ValidationError = validationError.children[0];
            property = `${property}.${validationErrorChild.property}`;
        }

        return property;
    }

    private determineSchulConnexError(validationError: ValidationError): {
        subCode: string;
        title: string;
        description: string;
    } {
        let subCode: string;

        if (validationError.constraints?.['isMinLength']) {
            subCode = '07';
        } else if (validationError.constraints?.['isDate']) {
            subCode = '09';
        } else if (validationError.constraints?.['isEnum']) {
            subCode = '10';
        } else if (validationError.constraints?.['isMaxLength']) {
            subCode = '15';
        } else if (validationError.constraints?.['isNotEmpty']) {
            subCode = '01';
        } else {
            subCode = '03';
        }

        switch (subCode) {
            case '01':
                return {
                    subCode,
                    title: 'Fehlende Parameter',
                    description: 'Folgende Parameter fehlen',
                };

            case '07':
                return {
                    subCode,
                    title: 'Attributwerte haben eine ungültige Länge',
                    description: 'Textlänge des Attributs ist nicht valide',
                };

            case '09':
                return {
                    subCode,
                    title: 'Datumsattribut hat einen ungültigen Wert',
                    description: 'Datumsformat des Attributs ist ungültig',
                };

            case '10':
                return {
                    subCode,
                    title: 'Attributwerte entsprechen keinem der erwarteten Werte',
                    description: 'Attribute müssen gültige Werte enthalten',
                };

            case '15':
                return {
                    subCode,
                    title: 'Text ist zu lang',
                    description: 'Die Länge des übergebenen Texts überschreitet die Maximallänge',
                };

            // default case is '03'
            default:
                return {
                    subCode,
                    title: 'Validierungsfehler',
                    description: 'Die Anfrage konnte aufgrund ungültiger Eingabe nicht erfolgreich validiert werden',
                };
        }
    }
}
