import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosInstance } from 'axios';
import { AuthenticationInterceptor } from './authentication.interceptor.js';
import { SessionData } from './frontend.controller.js';

describe('AuthenticatedGuard', () => {
    let module: TestingModule;
    let sut: AuthenticationInterceptor;

    let httpServiceMock: DeepMocked<HttpService>;

    beforeAll(async () => {
        const httpService: DeepMocked<HttpService> = createMock<HttpService>({
            axiosRef: createMock<AxiosInstance>({
                defaults: {
                    headers: {
                        common: {},
                    },
                },
            }),
        });

        module = await Test.createTestingModule({
            imports: [],
            providers: [AuthenticationInterceptor, { provide: HttpService, useValue: httpService }],
        }).compile();

        sut = module.get(AuthenticationInterceptor);
        httpServiceMock = module.get(HttpService);
    }, 30 * 1_000);

    afterAll(async () => {
        await module.close();
    }, 30 * 1_000);

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('intercept', () => {
        it('should set the default authorization header', () => {
            const dummyToken: string = 'JWT_Token_Dummy';

            const contextMock: ExecutionContext = createMock<ExecutionContext>({
                switchToHttp: () =>
                    createMock<HttpArgumentsHost>({
                        getRequest: () =>
                            createMock<Express.Request>({
                                session: createMock<SessionData>({ access_token: dummyToken }),
                            }),
                    }),
            });
            const next: CallHandler = createMock<CallHandler>();

            sut.intercept(contextMock, next);

            expect(httpServiceMock.axiosRef.defaults.headers.common.Authorization).toEqual(`Bearer ${dummyToken}`);
        });
    });
});
