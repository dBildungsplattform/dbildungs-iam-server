import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticatedGuard } from './authentication.guard.js';
import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext } from '@nestjs/common';
import { SessionData } from './session.js';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';

describe('AuthenticatedGuard', () => {
    let module: TestingModule;
    let sut: AuthenticatedGuard;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [],
            providers: [AuthenticatedGuard],
        }).compile();

        sut = module.get(AuthenticatedGuard);
    }, 30 * 1_000);

    afterAll(async () => {
        await module.close();
    }, 30 * 1_000);

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('canActivate', () => {
        it('should return true when the session contains a token', () => {
            const contextMock: ExecutionContext = createMock<ExecutionContext>({
                switchToHttp: () =>
                    createMock<HttpArgumentsHost>({
                        getRequest: () =>
                            createMock<Express.Request>({
                                session: createMock<SessionData>({ access_token: 'aValidToken' }),
                            }),
                    }),
            });

            const result: boolean = sut.canActivate(contextMock);

            expect(result).toBe(true);
        });

        it("should return false when the session doesn't contain a token", () => {
            const contextMock: ExecutionContext = createMock<ExecutionContext>({
                switchToHttp: () =>
                    createMock<HttpArgumentsHost>({
                        getRequest: () =>
                            createMock<Express.Request>({
                                session: {},
                            }),
                    }),
            });

            const result: boolean = sut.canActivate(contextMock);

            expect(result).toBe(false);
        });

        it("should return false when the session doesn't exist", () => {
            const contextMock: ExecutionContext = createMock<ExecutionContext>({
                switchToHttp: () =>
                    createMock<HttpArgumentsHost>({
                        getRequest: () => createMock<Express.Request>(),
                    }),
            });

            const result: boolean = sut.canActivate(contextMock);

            expect(result).toBe(false);
        });
    });
});
