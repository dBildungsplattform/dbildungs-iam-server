import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { ResultInterceptor } from './result-interceptor.js';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { ConfigTestModule } from '../../../test/utils/index.js';
import { EntityNotFoundError, KeycloakClientError } from '../error/index.js';

describe('ResultInterceptor', () => {
    let module: TestingModule;
    let sut: ResultInterceptor<string>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule],
            providers: [ResultInterceptor],
        }).compile();
        sut = module.get(ResultInterceptor);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('intercept', () => {
        describe('when result of intercepted method is ok:true, value:string', () => {
            it('should be defined', () => {
                const executionContext: ExecutionContext = createMock(ExecutionContext);
                const callHandler: CallHandler<Result<string>> = {
                    handle(): Observable<Result<string>> {
                        return of({
                            ok: true,
                            value: 'somePasswd',
                        });
                    },
                };
                const result: Observable<string> = sut.intercept(executionContext, callHandler);
                result.subscribe((data: string) => {
                    expect(data).toBeDefined();
                });
                expect(result).toBeDefined();
            });
        });
        describe('when result of intercepted method is ok:false, error', () => {
            describe('when error is EntityNotFoundError', () => {
                it('should be defined', () => {
                    const executionContext: ExecutionContext = createMock(ExecutionContext);
                    const callHandler: CallHandler<Result<string>> = {
                        handle(): Observable<Result<string>> {
                            return of({
                                ok: false,
                                error: new EntityNotFoundError(),
                            });
                        },
                    };
                    const result: Observable<string> = sut.intercept(executionContext, callHandler);
                    result.subscribe(
                        (data: string) => {
                            expect(data).toBeDefined();
                        },
                        (error: Error) => expect(error).toBeDefined(),
                    );
                    expect(result).toBeDefined();
                });
            });
            describe('when error is other error', () => {
                it('should be defined', () => {
                    const executionContext: ExecutionContext = createMock(ExecutionContext);
                    const callHandler: CallHandler<Result<string>> = {
                        handle(): Observable<Result<string>> {
                            return of({
                                ok: false,
                                error: new KeycloakClientError(''),
                            });
                        },
                    };
                    const result: Observable<string> = sut.intercept(executionContext, callHandler);
                    result.subscribe(
                        (data: string) => {
                            expect(data).toBeDefined();
                        },
                        (error: Error) => expect(error).toBeDefined(),
                    );
                    expect(result).toBeDefined();
                });
            });
        });
    });
});
