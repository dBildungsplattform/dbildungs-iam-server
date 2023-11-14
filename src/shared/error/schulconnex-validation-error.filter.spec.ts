import { ValidationError } from 'class-validator';
import { DetailedValidationError } from '../validation/detailed-validation.error.js';
import { SchulConnexValidationErrorFilter } from './schulconnex-validation-error.filter.js';
import { ArgumentsHost } from '@nestjs/common';
import { SchulConnexError } from './schulconnex.error.js';

describe('SchulconnexValidationErrorFilter', () => {
    let filter: SchulConnexValidationErrorFilter;
    const statusCode: number = 400;

    const mockResponse: Response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    } as unknown as Response;

    const host: ArgumentsHost = {
        switchToHttp: jest.fn().mockReturnValue({
            getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
    } as unknown as ArgumentsHost;

    let validationError: ValidationError = {
        property: 'fieldName',
    };

    const generalBadRequestError: SchulConnexError = {
        statusCode: statusCode,
        subCode: '00',
        title: 'fehlerhafte Anfrage',
        description: 'Die Anfrage ist fehlerhaft',
    };

    const standardValidationError: SchulConnexError = {
        statusCode: statusCode,
        subCode: '03',
        title: 'Validierungsfehler',
        description: `Die Anfrage konnte aufgrund ungültiger Eingabe nicht erfolgreich validiert werden '${validationError.property}'`,
    };

    const invalidLengthOfValueError: SchulConnexError = {
        statusCode: statusCode,
        subCode: '07',
        title: 'Attributwerte haben eine ungültige Länge',
        description: `Textlänge des Attributs ist nicht valide '${validationError.property}'`,
    };

    const datumError: SchulConnexError = {
        statusCode: statusCode,
        subCode: '09',
        title: 'Datumsattribut hat einen ungültigen Wert',
        description: `Datumsformat des Attributs ist ungültig '${validationError.property}'`,
    };

    const enumError: SchulConnexError = {
        statusCode: statusCode,
        subCode: '10',
        title: 'Attributwerte entsprechen keinem der erwarteten Werte',
        description: `Attribute müssen gültige Werte enthalten '${validationError.property}'`,
    };

    const textLengthError: SchulConnexError = {
        statusCode: statusCode,
        subCode: '15',
        title: 'Text ist zu lang',
        description: `Die Länge des übergebenen Texts überschreitet die Maximallänge '${validationError.property}'`,
    };

    const jsonStructureError: SchulConnexError = {
        statusCode: statusCode,
        subCode: '04',
        title: 'JSON-Struktur ist ungültig',
        description: `Der Payload entspricht keiner gültigen JSON-Struktur. '${validationError.property}'`,
    };

    beforeEach(() => {
        filter = new SchulConnexValidationErrorFilter();
    });

    describe('catch', () => {
        describe('when calling the filter with standard validation error', () => {
            it('should return a validation error', () => {
                validationError = {
                    property: 'fieldName',
                    constraints: {
                        isEmail: 'Email is invalid',
                    },
                    children: [
                        {
                            property: 'fieldName',
                            constraints: {
                                isNotEmpty: 'Field should not be empty',
                            },
                        },
                    ],
                };
                const validationErrors: ValidationError[] = [validationError];
                const detailedValidationError: DetailedValidationError = new DetailedValidationError(validationErrors);

                filter.catch(detailedValidationError, host);

                expect(mockResponse.status).toHaveBeenCalledWith(standardValidationError.statusCode);
                expect(mockResponse.json).toHaveBeenCalledWith(standardValidationError);
            });
        });

        describe('when calling the filter with no validation errors', () => {
            it('should return a general schulconnex bad request error', () => {
                const detailedValidationError: DetailedValidationError = new DetailedValidationError([]);

                filter.catch(detailedValidationError, host);

                expect(mockResponse.status).toHaveBeenCalledWith(generalBadRequestError.statusCode);
                expect(mockResponse.json).toHaveBeenCalledWith(generalBadRequestError);
            });
        });

        describe('when calling the filter with invalid value error', () => {
            it('should return a validation error', () => {
                validationError = {
                    property: 'fieldName',
                    constraints: {
                        isMinLength: 'Text is too short',
                    },
                };
                const detailedValidationError: DetailedValidationError = new DetailedValidationError([validationError]);

                filter.catch(detailedValidationError, host);

                expect(mockResponse.status).toHaveBeenCalledWith(invalidLengthOfValueError.statusCode);
                expect(mockResponse.json).toHaveBeenCalledWith(invalidLengthOfValueError);
            });
        });

        describe('when calling the filter with invalid value error', () => {
            it('should return a validation error', () => {
                validationError = {
                    property: 'fieldName',
                    constraints: {
                        isDate: 'Date value is invalid',
                    },
                };
                const detailedValidationError: DetailedValidationError = new DetailedValidationError([validationError]);

                filter.catch(detailedValidationError, host);

                expect(mockResponse.status).toHaveBeenCalledWith(datumError.statusCode);
                expect(mockResponse.json).toHaveBeenCalledWith(datumError);
            });
        });

        describe('when calling the filter with invalid value error', () => {
            it('should return a validation error', () => {
                validationError = {
                    property: 'fieldName',
                    constraints: {
                        isEnum: 'value does not match with enum',
                    },
                };
                const detailedValidationError: DetailedValidationError = new DetailedValidationError([validationError]);

                filter.catch(detailedValidationError, host);

                expect(mockResponse.status).toHaveBeenCalledWith(enumError.statusCode);
                expect(mockResponse.json).toHaveBeenCalledWith(enumError);
            });
        });

        describe('when calling the filter with invalid value error', () => {
            it('should return a validation error', () => {
                validationError = {
                    property: 'fieldName',
                    constraints: {
                        isMaxLength: 'value does not match with enum',
                    },
                };
                const detailedValidationError: DetailedValidationError = new DetailedValidationError([validationError]);

                filter.catch(detailedValidationError, host);

                expect(mockResponse.status).toHaveBeenCalledWith(textLengthError.statusCode);
                expect(mockResponse.json).toHaveBeenCalledWith(textLengthError);
            });
        });

        describe('when calling the filter with invalid value error', () => {
            it('should return a validation error', () => {
                validationError = {
                    property: 'fieldName',
                    constraints: {},
                    children: [],
                };
                const detailedValidationError: DetailedValidationError = new DetailedValidationError([validationError]);

                filter.catch(detailedValidationError, host);

                expect(mockResponse.status).toHaveBeenCalledWith(jsonStructureError.statusCode);
                expect(mockResponse.json).toHaveBeenCalledWith(jsonStructureError);
            });
        });
    });
});
