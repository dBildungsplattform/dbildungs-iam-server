import { AccessGuard, DISABLE_ACCESS_GUARD_FLAG } from './access.guard.js';
import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import express, { Request } from 'express';
import { AuthGuard, IAuthGuard } from '@nestjs/passport';
import { Mock, MockedObject } from 'vitest';
import { createExecutionContextMock, createRequestMock } from '../../../../test/utils/http.mocks.js';

const canActivateSpy: Mock = vi.spyOn(AuthGuard('jwt').prototype as IAuthGuard, 'canActivate');

describe('The access guard', () => {
    let reflector: DeepMocked<Reflector>;
    let sut: AccessGuard;

    beforeEach(() => {
        reflector = createMock(Reflector);
        sut = new AccessGuard(reflector);
    });

    it('should allow activation if disabled', () => {
        reflector.get.mockReturnValueOnce(true);
        const executionContext: ExecutionContext = createExecutionContextMock();
        executionContext.getHandler = vi.fn().mockReturnValue({});

        expect(sut.canActivate(executionContext)).toEqual(true);
        expect(reflector.get).toHaveBeenCalledWith(DISABLE_ACCESS_GUARD_FLAG, {});
    });

    it('should allow activation if request authenticated', () => {
        reflector.get.mockReturnValueOnce(false);
        const request: MockedObject<Request> = createRequestMock();

        (request.isAuthenticated as unknown as Mock<() => boolean>).mockReturnValue(true);

        const context: ExecutionContext = createExecutionContextMock({ request });
        (
            context.switchToHttp().getRequest<DeepMocked<express.Request>>().isAuthenticated as unknown as Mock<
                () => boolean
            >
        ).mockReturnValue(true);
        expect(sut.canActivate(context)).toEqual(true);
    });

    it('should delegate its activation if it cannot decide for itself', async () => {
        reflector.get.mockReturnValueOnce(false);

        const context: ExecutionContext = createExecutionContextMock();
        (
            context.switchToHttp().getRequest<DeepMocked<express.Request>>().isAuthenticated as unknown as Mock<
                () => boolean
            >
        ).mockReturnValue(false);

        canActivateSpy.mockResolvedValueOnce(true);

        await sut.canActivate(context);

        expect(canActivateSpy).toHaveBeenCalled();
    });
});
