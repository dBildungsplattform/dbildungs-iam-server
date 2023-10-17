import { Observable, from, lastValueFrom } from 'rxjs';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { GlobalPaginationHeadersInterceptor } from './global-pagination-headers.interceptor.js';
import { Response } from 'express';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { PagedResponse } from './paged.response.js';

describe('GlobalPaginationHeadersInterceptor', () => {
    const sut: GlobalPaginationHeadersInterceptor = new GlobalPaginationHeadersInterceptor();
    let responseMock: DeepMocked<Response>;
    let contextMock: DeepMocked<ExecutionContext>;
    let callHandlerMock: DeepMocked<CallHandler>;

    describe('intercept', () => {
        describe('when intercepting a paged response', () => {
            beforeEach(() => {
                responseMock = createMock<Response>();
                contextMock = createMock<ExecutionContext>({
                    switchToHttp: () =>
                        createMock<HttpArgumentsHost>({
                            getResponse: () => responseMock,
                        }),
                });
                callHandlerMock = createMock<CallHandler>({
                    handle: () => from([new PagedResponse({ offset: 0, limit: 0, total: 0, items: [] })]),
                });
            });

            it('should set pagination headers for the response', async () => {
                const observable: Observable<unknown> = sut.intercept(contextMock, callHandlerMock);

                // is needed to execute the observable pipeline
                await lastValueFrom(observable);

                expect(responseMock.setHeader).toBeCalledTimes(3);
                expect(responseMock.setHeader).toBeCalledWith('pagination-offset', 0);
                expect(responseMock.setHeader).toBeCalledWith('pagination-limit', 0);
                expect(responseMock.setHeader).toBeCalledWith('pagination-total', 0);
            });

            it('should change response type to list', async () => {
                const observable: Observable<unknown> = sut.intercept(contextMock, callHandlerMock);

                await expect(lastValueFrom(observable)).resolves.toStrictEqual([]);
            });
        });

        describe('when intercepting a non paged response', () => {
            beforeEach(() => {
                responseMock = createMock<Response>();
                contextMock = createMock<ExecutionContext>({
                    switchToHttp: () =>
                        createMock<HttpArgumentsHost>({
                            getResponse: () => responseMock,
                        }),
                });
                callHandlerMock = createMock<CallHandler>({
                    handle: () => from([null]),
                });
            });

            it('should not set any headers', async () => {
                const observable: Observable<unknown> = sut.intercept(contextMock, callHandlerMock);

                // is needed to execute the observable pipeline
                await lastValueFrom(observable);

                expect(responseMock.setHeader).toBeCalledTimes(0);
            });

            it('should not change response type', async () => {
                const observable: Observable<unknown> = sut.intercept(contextMock, callHandlerMock);

                await expect(lastValueFrom(observable)).resolves.toBeNull();
            });
        });
    });
});
