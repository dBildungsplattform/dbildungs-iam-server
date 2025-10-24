import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { OxErrorType, OxSendService } from './ox-send-service';
import { ClassLogger } from '../../../../core/logging/class-logger';
import { ConfigTestModule } from '../../../../../test/utils';
import { ConfigService } from '@nestjs/config';
import { OxBaseAction } from '../actions/ox-base-action';
import { DomainError } from '../../../../shared/error';
import { OxError } from '../../../../shared/error/ox.error';
import { OxPrimaryMailNotEqualEmail1Error } from '../error/ox-primary-mail-not-equal-email1.error';
import { faker } from '@faker-js/faker';
import assert from 'assert';
import { OxMemberAlreadyInGroupError } from '../error/ox-member-already-in-group.error';

describe('OxServiceConstructor', () => {
    it('should set default retries', () => {
        const configServiceMock: DeepMocked<ConfigService<unknown>> = createMock<ConfigService>({
            getOrThrow: () => ({}), // Empty OX config
        });

        const sut: OxSendService = new OxSendService(createMock(), createMock(), configServiceMock);

        expect(configServiceMock.getOrThrow).toHaveBeenCalledTimes(1);
        expect((sut as unknown as { max_retries: number }).max_retries).toBe(3);
    });
});

describe('OxSendService', () => {
    let module: TestingModule;
    let sut: OxSendService;

    let httpServiceMock: DeepMocked<HttpService>;
    let loggerMock: DeepMocked<ClassLogger>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule],
            providers: [
                OxSendService,
                {
                    provide: HttpService,
                    useValue: createMock<HttpService>(),
                },
                {
                    provide: ClassLogger,
                    useValue: createMock<ClassLogger>(),
                },
            ],
        }).compile();

        sut = module.get(OxSendService);
        httpServiceMock = module.get(HttpService);
        loggerMock = module.get(ClassLogger);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('send', () => {
        it('should call HttpService.post', async () => {
            const mockAction: DeepMocked<OxBaseAction<unknown, unknown>> = createMock<OxBaseAction<unknown, unknown>>();
            mockAction.buildRequest.mockReturnValueOnce({});
            mockAction.action = 'testAction';
            mockAction.soapServiceName = 'TestService';
            httpServiceMock.post.mockReturnValueOnce(of({} as AxiosResponse));

            await sut.send(mockAction);

            expect(httpServiceMock.post).toHaveBeenCalledWith(
                'https://ox_ip:ox_port/webservices/TestService',
                expect.stringContaining('username'),
                {
                    headers: {
                        'Content-Type': 'text/xml;charset=UTF-8',
                        SOAPAction: `"testAction"`,
                    },
                },
            );
        });

        it('should call parseResponse of action and return result', async () => {
            const mockAction: DeepMocked<OxBaseAction<unknown, string>> = createMock<OxBaseAction<unknown, string>>();
            mockAction.buildRequest.mockReturnValueOnce({});
            mockAction.parseResponse.mockReturnValueOnce({ ok: true, value: 'TestResult' });
            mockAction.action = 'testAction';
            mockAction.soapServiceName = 'TestService';

            httpServiceMock.post.mockReturnValueOnce(of({} as AxiosResponse));

            const result: Result<string, DomainError> = await sut.send(mockAction);

            expect(result).toEqual({
                ok: true,
                value: 'TestResult',
            });
        });

        it('should return result if a retry succeeds', async () => {
            const mockAction: DeepMocked<OxBaseAction<unknown, string>> = createMock<OxBaseAction<unknown, string>>();
            mockAction.buildRequest.mockReturnValueOnce({});
            mockAction.parseResponse.mockReturnValueOnce({ ok: true, value: 'TestResult' });
            mockAction.action = 'testAction';
            mockAction.soapServiceName = 'TestService';

            const error: Error = new Error('AxiosError');
            httpServiceMock.post.mockReturnValueOnce(throwError(() => error)); // Fail first
            httpServiceMock.post.mockReturnValueOnce(of({} as AxiosResponse)); // Succeed on retry

            const result: Result<string, DomainError> = await sut.send(mockAction);

            expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                'Attempt 1 failed. Retrying in 15000ms... Remaining retries: 1',
                expect.any(Error),
            );
            expect(result).toEqual({
                ok: true,
                value: 'TestResult',
            });
        });

        it('should return OxError if request failed and response is NOT a specific OX-Error-response', async () => {
            const error: Error = new Error('AxiosError');
            const mockAction: DeepMocked<OxBaseAction<unknown, string>> = createMock<OxBaseAction<unknown, string>>();
            httpServiceMock.post.mockReturnValueOnce(throwError(() => error));
            httpServiceMock.post.mockReturnValueOnce(throwError(() => error)); // Retry

            const result: Result<string, DomainError> = await sut.send(mockAction);

            expect(result).toEqual({
                ok: false,
                error: new OxError('Request failed'),
            });
        });

        it('should return specific OxError and log error if request failed and response is a specific OX-Error-response', async () => {
            const faultString: string = 'primarymail must have the same value as email1; exceptionId 1826201806-2';
            const error: OxErrorType = {
                message: faker.string.alphanumeric(),
                code: faker.string.numeric(),
                response: {
                    status: 500,
                    statusText: 'statusText',
                    data:
                        '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">' +
                        '<soap:Body>' +
                        '<soap:Fault>' +
                        '<faultcode>soap:Server</faultcode>' +
                        '<faultstring>' +
                        faultString +
                        '</faultstring>' +
                        '</soap:Fault>' +
                        '</soap:Body>' +
                        '</soap:Envelope>',
                },
            };

            const mockAction: DeepMocked<OxBaseAction<unknown, string>> = createMock<OxBaseAction<unknown, string>>();
            httpServiceMock.post.mockReturnValueOnce(throwError(() => error));
            httpServiceMock.post.mockReturnValueOnce(throwError(() => error)); // Retry

            const result: Result<string, DomainError> = await sut.send(mockAction);

            expect(loggerMock.error).toHaveBeenCalledWith('OX_PRIMARY_MAIL_NOT_EQUAL_EMAIL1_ERROR');
            expect(result).toEqual({
                ok: false,
                error: new OxPrimaryMailNotEqualEmail1Error(faultString),
            });
        });

        it('should return specific general OxError and log error if request failed and response could NOT be parsed', async () => {
            const faultyErrorWithMissingFaultString: OxErrorType = {
                message: faker.string.alphanumeric(),
                code: faker.string.numeric(),
                response: {
                    status: 500,
                    statusText: 'statusText',
                    data:
                        '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">' +
                        '<soap:Body>' +
                        '<soap:Fault>' +
                        '<faultcode>soap:Server</faultcode>' +
                        '</soap:Fault>' +
                        '</soap:Body>' +
                        '</soap:Envelope>',
                },
            };

            const mockAction: DeepMocked<OxBaseAction<unknown, string>> = createMock<OxBaseAction<unknown, string>>();
            httpServiceMock.post.mockReturnValueOnce(throwError(() => faultyErrorWithMissingFaultString));
            httpServiceMock.post.mockReturnValueOnce(throwError(() => faultyErrorWithMissingFaultString)); // Retry

            const result: Result<string, DomainError> = await sut.send(mockAction);

            expect(loggerMock.error).toHaveBeenCalledWith(`OX-response could not be parsed after error occurred`);
            expect(result).toEqual({
                ok: false,
                error: new OxError('OX-Response Could Not Be Parsed'),
            });
        });

        it('should skip retry for non-retryable errors', async () => {
            const faultString: string = 'Member already exists in group; exceptionId -483860422-666';
            const error: OxErrorType = {
                message: faker.string.alphanumeric(),
                code: faker.string.numeric(),
                response: {
                    status: 500,
                    statusText: 'statusText',
                    data:
                        '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">' +
                        '<soap:Body>' +
                        '<soap:Fault>' +
                        '<faultcode>soap:Server</faultcode>' +
                        '<faultstring>' +
                        faultString +
                        '</faultstring>' +
                        '</soap:Fault>' +
                        '</soap:Body>' +
                        '</soap:Envelope>',
                },
            };
            const mockAction: DeepMocked<OxBaseAction<unknown, string>> = createMock<OxBaseAction<unknown, string>>();
            httpServiceMock.post.mockReturnValueOnce(throwError(() => error));

            const result: Result<string, DomainError> = await sut.send(mockAction);

            assert(!result.ok);
            expect(result.error).toBeInstanceOf(OxMemberAlreadyInGroupError);
            expect(result.error.message).toContain(faultString);
        });
    });
});
