import { ArgumentsHost } from '@nestjs/common';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Response } from 'express';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import {OrganisationExceptionFilter} from "./organisation-exception-filter";
import {OrganisationSpecificationError} from "../specification/error/organisation-specification.error.js";
import {DbiamOrganisationError, OrganisationSpecificationErrorI18nTypes} from "./dbiam-organisation.error.js";

describe('OrganisationExceptionFilter', () => {
    let filter: OrganisationExceptionFilter;
    const statusCode: number = 400;
    let responseMock: DeepMocked<Response>;
    let argumentsHost: DeepMocked<ArgumentsHost>;


    const generalBadRequestError: DbiamOrganisationError = new DbiamOrganisationError({
        code: 500,
        i18nKey: OrganisationSpecificationErrorI18nTypes.ORGANISATION_SPECIFICATION_ERROR,
        titel: 'Spezifikation von Organisation nicht erfüllt',
        beschreibung:
            'Eine Spezifikation für eine Organisation wurde nicht erfüllt, der Fehler konnte jedoch nicht zugeordnet werden.',
    });

    beforeEach(() => {
        filter = new OrganisationExceptionFilter();
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
            it('should throw a general OrganisationSpecificationError', () => {
                const error: OrganisationSpecificationError = new OrganisationSpecificationError('error', undefined);

                filter.catch(error, argumentsHost);

                expect(responseMock.json).toHaveBeenCalled();
                expect(responseMock.status).toHaveBeenCalledWith(statusCode);
                expect(responseMock.json).toHaveBeenCalledWith(generalBadRequestError);
            });
        });

    });
});
