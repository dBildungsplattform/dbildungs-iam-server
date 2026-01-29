import { DetailedValidationError } from '../validation/detailed-validation.error.js';
import { SchulConnexValidationErrorFilter } from './schulconnex-validation-error.filter.js';
import { ArgumentsHost } from '@nestjs/common';
import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { Response } from 'express';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { ValidationError } from 'class-validator';
import { SchulConnexError } from './schul-connex.error.js';

describe('SchulconnexValidationErrorFilter', () => {
    let filter: SchulConnexValidationErrorFilter;
    const statusCode: number = 400;
    let responseMock: DeepMocked<Response>;
    let argumentsHost: DeepMocked<ArgumentsHost>;
    let validationError: ValidationError;

    const generalBadRequestError: SchulConnexError = new SchulConnexError({
        code: statusCode,
        subcode: '00',
        titel: 'Fehlerhafte Anfrage',
        beschreibung: 'Die Anfrage ist fehlerhaft',
    });

    const isNotEmptyError: SchulConnexError = new SchulConnexError({
        code: statusCode,
        subcode: '01',
        titel: 'Fehlende Parameter',
        beschreibung: `Folgende Parameter fehlen 'fieldName'`,
    });

    const standardValidationError: SchulConnexError = new SchulConnexError({
        code: statusCode,
        subcode: '03',
        titel: 'Validierungsfehler',
        beschreibung: `Die Anfrage konnte aufgrund ungültiger Eingabe nicht erfolgreich validiert werden 'fieldName'`,
    });

    const complexStandardValidationError: SchulConnexError = new SchulConnexError({
        code: statusCode,
        subcode: '03',
        titel: 'Validierungsfehler',
        beschreibung: `Die Anfrage konnte aufgrund ungültiger Eingabe nicht erfolgreich validiert werden 'fieldName.fieldName'`,
    });

    const invalidLengthOfValueError: SchulConnexError = new SchulConnexError({
        code: statusCode,
        subcode: '07',
        titel: 'Attributwerte haben eine ungültige Länge',
        beschreibung: `Textlänge des Attributs ist nicht valide 'fieldName'`,
    });

    const datumError: SchulConnexError = new SchulConnexError({
        code: statusCode,
        subcode: '09',
        titel: 'Datumsattribut hat einen ungültigen Wert',
        beschreibung: `Datumsformat des Attributs ist ungültig 'fieldName'`,
    });

    const enumError: SchulConnexError = new SchulConnexError({
        code: statusCode,
        subcode: '10',
        titel: 'Attributwerte entsprechen keinem der erwarteten Werte',
        beschreibung: `Attribute müssen gültige Werte enthalten 'fieldName'`,
    });

    const textLengthError: SchulConnexError = new SchulConnexError({
        code: statusCode,
        subcode: '15',
        titel: 'Text ist zu lang',
        beschreibung: `Die Länge des übergebenen Texts überschreitet die Maximallänge 'fieldName'`,
    });

    beforeEach(() => {
        filter = new SchulConnexValidationErrorFilter();
        responseMock = createMock(Response);
        argumentsHost = createMock<ArgumentsHost>({
            switchToHttp: () =>
                createMock<HttpArgumentsHost>({
                    getResponse: () => responseMock,
                }),
        });
    });

    describe('catch', () => {
        describe('when filter catches undefined validation error', () => {
            it('should throw a general schulconnex exception', () => {
                const detailedValidationError: DetailedValidationError = new DetailedValidationError([]);

                filter.catch(detailedValidationError, argumentsHost);

                expect(responseMock.json).toHaveBeenCalled();
                expect(responseMock.status).toHaveBeenCalledWith(statusCode);
                expect(responseMock.json).toHaveBeenCalledWith(generalBadRequestError);
            });
        });

        describe('when filter catches a validation error', () => {
            beforeEach(() => {
                validationError = {
                    property: 'fieldName',
                    constraints: {
                        isEmail: 'Email is invalid',
                    },
                };
            });

            it('should throw a validation schulconnex exception', () => {
                const detailedValidationError: DetailedValidationError = new DetailedValidationError([validationError]);

                filter.catch(detailedValidationError, argumentsHost);

                expect(responseMock.json).toHaveBeenCalled();
                expect(responseMock.status).toHaveBeenCalledWith(statusCode);
                expect(responseMock.json).toHaveBeenCalledWith(standardValidationError);
            });
        });

        describe('when filter catches a is not empty validation error ', () => {
            beforeEach(() => {
                validationError = {
                    property: 'fieldName',
                    constraints: {
                        isNotEmpty: 'Property should not be empty',
                    },
                };
            });

            it('should throw a is not empty exception', () => {
                const detailedValidationError: DetailedValidationError = new DetailedValidationError([validationError]);

                filter.catch(detailedValidationError, argumentsHost);

                expect(responseMock.json).toHaveBeenCalled();
                expect(responseMock.status).toHaveBeenCalledWith(statusCode);
                expect(responseMock.json).toHaveBeenCalledWith(isNotEmptyError);
            });
        });

        describe('when filter catches an invalid value validation error', () => {
            beforeEach(() => {
                validationError = {
                    property: 'fieldName',
                    constraints: {
                        isMinLength: 'Text length is invalid',
                    },
                };
            });

            it('should throw an invalid value exception', () => {
                const detailedValidationError: DetailedValidationError = new DetailedValidationError([validationError]);

                filter.catch(detailedValidationError, argumentsHost);

                expect(responseMock.status).toHaveBeenCalledWith(statusCode);
                expect(responseMock.json).toHaveBeenCalledWith(invalidLengthOfValueError);
            });
        });

        describe('when filter catches an invalid date value validation error', () => {
            beforeEach(() => {
                validationError = {
                    property: 'fieldName',
                    constraints: {
                        isDate: 'Date value is invalid',
                    },
                };
            });

            it('should throw an invalid date exception', () => {
                const detailedValidationError: DetailedValidationError = new DetailedValidationError([validationError]);

                filter.catch(detailedValidationError, argumentsHost);

                expect(responseMock.status).toHaveBeenCalledWith(statusCode);
                expect(responseMock.json).toHaveBeenCalledWith(datumError);
            });
        });

        describe('when filter catches an invalid enum value validation error', () => {
            beforeEach(() => {
                validationError = {
                    property: 'fieldName',
                    constraints: {
                        isEnum: 'value does not match with enum',
                    },
                };
            });

            it('should throw a invalid enum exception', () => {
                const detailedValidationError: DetailedValidationError = new DetailedValidationError([validationError]);

                filter.catch(detailedValidationError, argumentsHost);

                expect(responseMock.json).toHaveBeenCalled();
                expect(responseMock.status).toHaveBeenCalledWith(statusCode);
                expect(responseMock.json).toHaveBeenCalledWith(enumError);
            });
        });

        describe('when filter catches an invalid length validation error', () => {
            beforeEach(() => {
                validationError = {
                    property: 'fieldName',
                    constraints: {
                        isMaxLength: 'value does not match with enum',
                    },
                };
            });

            it('should throw a invalid length exception', () => {
                const detailedValidationError: DetailedValidationError = new DetailedValidationError([validationError]);

                filter.catch(detailedValidationError, argumentsHost);

                expect(responseMock.json).toHaveBeenCalled();
                expect(responseMock.status).toHaveBeenCalledWith(statusCode);
                expect(responseMock.json).toHaveBeenCalledWith(textLengthError);
            });
        });

        describe('when filter catches a validation error that has a child validation error', () => {
            beforeEach(() => {
                validationError = {
                    property: 'fieldName',
                    constraints: {
                        isEnum: 'enum is invalid',
                    },
                    children: [
                        {
                            property: 'fieldName',
                            constraints: {
                                isEmail: 'value of mail is invalid',
                            },
                            children: [
                                {
                                    property: 'fieldName',
                                    constraints: {
                                        isString: 'value of enum should be a string',
                                    },
                                },
                            ],
                        },
                    ],
                };
            });

            it('should throw a child validation schulconnex exception', () => {
                const detailedValidationError: DetailedValidationError = new DetailedValidationError([validationError]);

                filter.catch(detailedValidationError, argumentsHost);

                expect(responseMock.json).toHaveBeenCalled();
                expect(responseMock.status).toHaveBeenCalledWith(statusCode);
                expect(responseMock.json).toHaveBeenCalledWith(complexStandardValidationError);
            });
        });

        describe('when filter catches a validation error without constraints', () => {
            beforeEach(() => {
                validationError = {
                    property: 'fieldName',
                };
            });

            it('should throw a general bad bad request exception', () => {
                const detailedValidationError: DetailedValidationError = new DetailedValidationError([validationError]);

                filter.catch(detailedValidationError, argumentsHost);

                expect(responseMock.json).toHaveBeenCalled();
                expect(responseMock.status).toHaveBeenCalledWith(statusCode);
                expect(responseMock.json).toHaveBeenCalledWith(generalBadRequestError);
            });
        });
    });
});
