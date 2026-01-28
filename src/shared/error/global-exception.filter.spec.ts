import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { AbstractHttpAdapter, HttpAdapterHost } from '@nestjs/core';
import { Response } from 'express';
import { ClassLogger } from '../../core/logging/class-logger.js';
import { GlobalExceptionFilter } from './global-exception.filter.js';
import { DriverException } from '@mikro-orm/core';
import { SchulConnexError } from './schul-connex.error.js';

describe('GlobalExceptionFilter', () => {
    let sut: GlobalExceptionFilter;

    let loggerMock: DeepMocked<ClassLogger>;
    let adapterHostMock: DeepMocked<HttpAdapterHost>;
    let adapterImplMock: DeepMocked<AbstractHttpAdapter>;
    let responseMock: DeepMocked<Response>;
    let argumentsHost: DeepMocked<ArgumentsHost>;

    beforeEach(() => {
        loggerMock = createMock<ClassLogger>({});
        adapterImplMock = createMock(AbstractHttpAdapter);
        adapterHostMock = createMock<HttpAdapterHost>({
            get httpAdapter() {
                return adapterImplMock;
            },
        });
        sut = new GlobalExceptionFilter(adapterHostMock, loggerMock);
        responseMock = createMock(Response);
        argumentsHost = createMock<ArgumentsHost>({
            switchToHttp: () =>
                createMock<HttpArgumentsHost>({
                    getResponse: () => responseMock,
                }),
        });
    });

    describe('catch', () => {
        describe('when filter catches HttpException', () => {
            it('should pass it on to the http adapter', () => {
                const httpException: HttpException = new HttpException('exception', 400);

                sut.catch(httpException, argumentsHost);

                expect(adapterImplMock.reply).toHaveBeenCalledTimes(1);
                expect(adapterImplMock.reply).toHaveBeenCalledWith(
                    responseMock,
                    httpException.getResponse(),
                    httpException.getStatus(),
                );
                expect(loggerMock.crit).toHaveBeenCalledTimes(0);
            });
        });

        describe('when filter catches HttpException Service Unavailable', () => {
            it('should log request url with crit and pass it on to the http adapter', () => {
                const httpException: HttpException = new HttpException('exception', 503);

                sut.catch(httpException, argumentsHost);

                expect(adapterImplMock.reply).toHaveBeenCalledTimes(1);
                expect(adapterImplMock.reply).toHaveBeenCalledWith(
                    responseMock,
                    httpException.getResponse(),
                    httpException.getStatus(),
                );
                expect(loggerMock.crit).toHaveBeenCalledTimes(1);
            });
        });

        describe('when filter catches DriverException', () => {
            it('should map it to SchulConnexError with code 500', () => {
                const driverException: DriverException = new DriverException({ stack: '' } as Error);
                const expectedOutput: SchulConnexError = new SchulConnexError({
                    titel: 'Interner Serverfehler',
                    beschreibung: 'Es ist ein interner Fehler aufgetreten. Die Datenbank hat einen Fehler erzeugt.',
                    code: HttpStatus.INTERNAL_SERVER_ERROR,
                    subcode: '00',
                });

                sut.catch(driverException, argumentsHost);

                expect(adapterImplMock.reply).toHaveBeenCalledTimes(1);
                expect(adapterImplMock.reply).toHaveBeenCalledWith(
                    responseMock,
                    expectedOutput,
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
                expect(loggerMock.crit).toHaveBeenCalledTimes(1);
            });
        });

        describe('when filter catches Unknown Error', () => {
            it('should map it to SchulConnexError with code 500', () => {
                const unknownError: Error = new Error('error');
                const expectedOutput: SchulConnexError = new SchulConnexError({
                    titel: 'Interner Serverfehler',
                    beschreibung: 'Es ist ein interner Fehler aufgetreten. Der Fehler ist unbekannt.',
                    code: HttpStatus.INTERNAL_SERVER_ERROR,
                    subcode: '00',
                });

                sut.catch(unknownError, argumentsHost);

                expect(adapterImplMock.reply).toHaveBeenCalledTimes(1);
                expect(adapterImplMock.reply).toHaveBeenCalledWith(
                    responseMock,
                    expectedOutput,
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            });
        });

        describe('when filter catches unknown type which is not an Error', () => {
            it('should map it to SchulConnexError with code 500', () => {
                const unknownError: string = 'not an error';
                const expectedOutput: SchulConnexError = new SchulConnexError({
                    titel: 'Interner Serverfehler',
                    beschreibung: 'Es ist ein interner Fehler aufgetreten. Der Fehler ist unbekannt.',
                    code: HttpStatus.INTERNAL_SERVER_ERROR,
                    subcode: '00',
                });

                sut.catch(unknownError, argumentsHost);

                expect(adapterImplMock.reply).toHaveBeenCalledTimes(1);
                expect(adapterImplMock.reply).toHaveBeenCalledWith(
                    responseMock,
                    expectedOutput,
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            });
        });
    });
});
