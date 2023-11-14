import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';

import { AuthenticatedGuard } from './authenticated.guard.js';

describe('AuthenticatedGuard', () => {
    let module: TestingModule;
    let sut: AuthenticatedGuard;

    beforeAll(async () => {
        module = await Test.createTestingModule({
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
        it('should return true if user is authenticated', () => {
            const contextMock: DeepMocked<ExecutionContext> = createMock();
            contextMock.switchToHttp().getRequest<DeepMocked<Request>>().isAuthenticated.mockReturnValueOnce(true);

            const result: boolean = sut.canActivate(contextMock);

            expect(result).toBe(true);
        });

        it('should throw UnauthorizedException if user is not authenticated', () => {
            const contextMock: DeepMocked<ExecutionContext> = createMock();
            contextMock.switchToHttp().getRequest<DeepMocked<Request>>().isAuthenticated.mockReturnValueOnce(false);

            expect(() => sut.canActivate(contextMock)).toThrow(UnauthorizedException);
        });
    });
});
