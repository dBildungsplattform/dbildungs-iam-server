import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { OxService } from './ox.service.js';
import { OxBaseAction } from '../actions/ox-base-action.js';
import { OxError } from '../../../shared/error/ox.error.js';
import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { DomainError } from '../../../shared/error/domain.error.js';

describe('OxService', () => {
    let module: TestingModule;
    let sut: OxService;

    let httpServiceMock: DeepMocked<HttpService>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule],
            providers: [
                OxService,
                {
                    provide: HttpService,
                    useValue: createMock<HttpService>(),
                },
            ],
        }).compile();

        sut = module.get(OxService);
        httpServiceMock = module.get(HttpService);
    });

    afterAll(async () => {
        await module.close();
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

        it('should return OxError if request failed', async () => {
            const error: Error = new Error('AxiosError');
            const mockAction: DeepMocked<OxBaseAction<unknown, string>> = createMock<OxBaseAction<unknown, string>>();
            httpServiceMock.post.mockReturnValueOnce(throwError(() => error));

            const result: Result<string, DomainError> = await sut.send(mockAction);

            expect(result).toEqual({
                ok: false,
                error: new OxError('Request failed', [error]),
            });
        });
    });
});
