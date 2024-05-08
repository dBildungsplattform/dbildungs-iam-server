import { ArgumentsHost } from '@nestjs/common';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Response } from 'express';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import {PersonenkontextExceptionFilter} from "./personenkontext-exception-filter.js";
import {PersonenkontextSpecificationError} from "../specification/error/personenkontext-specification.error.js";
import {DbiamPersonenkontextError, PersonenkontextSpecificationErrorI18nTypes} from "./dbiam-personenkontext.error.js";

describe('PersonenkontextExceptionFilter', () => {
    let filter: PersonenkontextExceptionFilter;
    const statusCode: number = 400;
    let responseMock: DeepMocked<Response>;
    let argumentsHost: DeepMocked<ArgumentsHost>;


    const generalBadRequestError: DbiamPersonenkontextError = new DbiamPersonenkontextError({
        code: 500,
        i18nKey: PersonenkontextSpecificationErrorI18nTypes.PERSONENKONTEXT_SPECIFICATION_ERROR,
        titel: 'Spezifikation von Personenkontext nicht erfüllt',
        beschreibung:
            'Eine Spezifikation für einen Personenkontext wurde nicht erfüllt, der Fehler konnte jedoch nicht zugeordnet werden.',
    });

    beforeEach(() => {
        filter = new PersonenkontextExceptionFilter();
        responseMock = createMock<Response>();
        argumentsHost = createMock<ArgumentsHost>({
            switchToHttp: () =>
                createMock<HttpArgumentsHost>({
                    getResponse: () => responseMock,
                }),
        });
    });

    describe('catch', () => {
        describe('when filter catches undefined error', () => {
            it('should throw a general PersonenkontextSpecificationError', () => {
                const error: PersonenkontextSpecificationError = new PersonenkontextSpecificationError('error');

                filter.catch(error, argumentsHost);

                expect(responseMock.json).toHaveBeenCalled();
                expect(responseMock.status).toHaveBeenCalledWith(statusCode);
                expect(responseMock.json).toHaveBeenCalledWith(generalBadRequestError);
            });
        });

    });
});
