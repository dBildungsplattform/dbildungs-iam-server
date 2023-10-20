import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { ExecutionContext } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyRequest } from 'fastify';

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
    }, 30 * 1_000);

    afterAll(async () => {
        await module.close();
    }, 30 * 1_000);

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('canActivate', () => {
        it('should return true when the session contains a token', () => {
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
            sessionMock.get.mockReturnValueOnce('SomeToken');

            const result: boolean = sut.canActivate(contextMock);

            expect(result).toBe(true);
        });

        it("should return false when the session doesn't contain a token", () => {
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
