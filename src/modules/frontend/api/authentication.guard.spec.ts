import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { ExecutionContext } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyRequest } from 'fastify';
import { TokenSet } from 'openid-client';
import { DEFAULT_TIMEOUT_FOR_TESTCONTAINERS } from '../../../../test/utils/index.js';
import { AuthenticatedGuard } from './authentication.guard.js';
import { SessionData } from './frontend.controller.js';

describe('AuthenticatedGuard', () => {
    let module: TestingModule;
    let sut: AuthenticatedGuard;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [],
            providers: [AuthenticatedGuard],
        }).compile();

        sut = module.get(AuthenticatedGuard);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('canActivate', () => {
        it('should return true when the session is valid', () => {
            const sessionMock: DeepMocked<SessionData> = createMock<SessionData>();
            const contextMock: ExecutionContext = createMock<ExecutionContext>({
                switchToHttp: () =>
                    createMock<HttpArgumentsHost>({
                        getRequest: () =>
                            createMock<FastifyRequest>({
                                session: sessionMock,
                            }),
                    }),
            });
            const tokenSet: TokenSet = new TokenSet();
            tokenSet.expires_in = 5 * 60; // 5 Minutes
            sessionMock.get.mockReturnValueOnce(tokenSet);

            const result: boolean = sut.canActivate(contextMock);

            expect(result).toBe(true);
        });

        it('should return false when the tokens are expired', () => {
            const sessionMock: DeepMocked<SessionData> = createMock<SessionData>();
            const contextMock: ExecutionContext = createMock<ExecutionContext>({
                switchToHttp: () =>
                    createMock<HttpArgumentsHost>({
                        getRequest: () =>
                            createMock<FastifyRequest>({
                                session: sessionMock,
                            }),
                    }),
            });
            const tokenSet: TokenSet = new TokenSet();
            tokenSet.expires_in = -5 * 60 * 1_000; // 5 Minutes ago
            sessionMock.get.mockReturnValueOnce(tokenSet);

            const result: boolean = sut.canActivate(contextMock);

            expect(result).toBe(false);
        });

        it('should return false when the session has no tokens', () => {
            const sessionMock: DeepMocked<SessionData> = createMock<SessionData>();
            const contextMock: ExecutionContext = createMock<ExecutionContext>({
                switchToHttp: () =>
                    createMock<HttpArgumentsHost>({
                        getRequest: () =>
                            createMock<FastifyRequest>({
                                session: sessionMock,
                            }),
                    }),
            });
            sessionMock.get.mockReturnValueOnce(undefined);

            const result: boolean = sut.canActivate(contextMock);

            expect(result).toBe(false);
        });
    });
});
