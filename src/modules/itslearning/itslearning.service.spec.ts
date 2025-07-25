import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { ConfigTestModule, LoggingTestModule } from '../../../test/utils/index.js';
import { DomainError, ItsLearningError } from '../../shared/error/index.js';
import { IMSESAction } from './actions/base-action.js';
import { ItsLearningIMSESService } from './itslearning.service.js';
import { ClassLogger } from '../../core/logging/class-logger.js';

describe('ItsLearningIMSESService', () => {
    let module: TestingModule;
    let sut: ItsLearningIMSESService;

    let httpServiceMock: DeepMocked<HttpService>;
    let loggerMock: DeepMocked<ClassLogger>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [LoggingTestModule, ConfigTestModule],
            providers: [
                ItsLearningIMSESService,
                {
                    provide: HttpService,
                    useValue: createMock<HttpService>(),
                },
            ],
        }).compile();

        sut = module.get(ItsLearningIMSESService);
        httpServiceMock = module.get(HttpService);
        loggerMock = module.get(ClassLogger);
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('send', () => {
        it('should call HttpService.post', async () => {
            const mockAction: DeepMocked<IMSESAction<unknown, unknown>> = createMock<IMSESAction<unknown, unknown>>();
            mockAction.buildRequest.mockReturnValueOnce({});
            mockAction.action = 'testAction';
            httpServiceMock.post.mockReturnValueOnce(of({} as AxiosResponse));

            await sut.send(mockAction);

            expect(httpServiceMock.post).toHaveBeenCalledWith(
                'https://itslearning-test.example.com',
                expect.stringContaining('username'),
                {
                    headers: {
                        'Content-Type': 'text/xml;charset=UTF-8',
                        SOAPAction: `"testAction"`,
                    },
                },
            );
        });

        it('should include syncID if given', async () => {
            const mockAction: DeepMocked<IMSESAction<unknown, unknown>> = createMock<IMSESAction<unknown, unknown>>();
            mockAction.buildRequest.mockReturnValueOnce({});
            mockAction.action = 'testAction';
            httpServiceMock.post.mockReturnValueOnce(of({} as AxiosResponse));
            const syncID: string = 'sync-id-test';

            await sut.send(mockAction, syncID);

            expect(httpServiceMock.post).toHaveBeenCalledWith(
                'https://itslearning-test.example.com',
                expect.stringContaining(syncID),
                {
                    headers: {
                        'Content-Type': 'text/xml;charset=UTF-8',
                        SOAPAction: `"testAction"`,
                    },
                },
            );
        });

        it('should call parseResponse of action and return result', async () => {
            const mockAction: DeepMocked<IMSESAction<unknown, string>> = createMock<IMSESAction<unknown, string>>();
            mockAction.buildRequest.mockReturnValueOnce({});
            mockAction.parseResponse.mockReturnValueOnce({ ok: true, value: 'TestResult' });
            mockAction.action = 'testAction';
            httpServiceMock.post.mockReturnValueOnce(of({} as AxiosResponse));

            const result: Result<string, DomainError> = await sut.send(mockAction);

            expect(result).toEqual({
                ok: true,
                value: 'TestResult',
            });
        });

        describe('when an unexpected error occurs', () => {
            it('should retry the request and return the successfull result', async () => {
                const error: Error = new Error('AxiosError');
                const mockAction: DeepMocked<IMSESAction<unknown, string>> = createMock<IMSESAction<unknown, string>>();
                mockAction.parseResponse.mockReturnValueOnce({ ok: true, value: 'TestResult' });
                httpServiceMock.post.mockReturnValueOnce(throwError(() => error));
                httpServiceMock.post.mockReturnValueOnce(of({} as AxiosResponse));

                const result: Result<string, DomainError> = await sut.send(mockAction, 'test-id');

                expect(loggerMock.logUnknownAsWarning).toHaveBeenCalledWith(
                    `[SyncID: test-id] Request to itslearning failed, retrying in 100ms`,
                    error,
                );
                expect(result).toEqual({
                    ok: true,
                    value: 'TestResult',
                });
            });

            it('should retry the request and return the error if it still does not work', async () => {
                const error: Error = new Error('AxiosError');
                const mockAction: DeepMocked<IMSESAction<unknown, string>> = createMock<IMSESAction<unknown, string>>();
                httpServiceMock.post.mockReturnValueOnce(throwError(() => error));
                httpServiceMock.post.mockReturnValueOnce(throwError(() => error));

                const result: Result<string, DomainError> = await sut.send(mockAction, 'test-id');

                expect(loggerMock.logUnknownAsWarning).toHaveBeenCalledWith(
                    `[SyncID: test-id] Request to itslearning failed, retrying in 100ms`,
                    error,
                );
                expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                    `[SyncID: test-id] Request to itslearning failed all retries, aborting`,
                    error,
                );
                expect(result).toEqual({
                    ok: false,
                    error: new ItsLearningError('Request failed', [error]),
                });
            });
        });
    });
});
