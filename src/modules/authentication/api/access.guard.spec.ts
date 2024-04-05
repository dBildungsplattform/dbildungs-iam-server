import { AccessGuard, DISABLE_ACCESS_GUARD_FLAG } from './access.guard.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import express from 'express';

describe('The access guard', () => {
    let reflector: DeepMocked<Reflector>;
    let sut: AccessGuard;

    beforeEach(() => {
        reflector = createMock<Reflector>();
        sut = new AccessGuard(reflector);
    });

    it('should allow activation if disabled', () => {
        reflector.get.mockReturnValueOnce(true);

        expect(sut.canActivate(createMock())).toEqual(true);
        expect(reflector.get).toHaveBeenCalledWith(DISABLE_ACCESS_GUARD_FLAG, {});
    });

    it('should allow activation if request authenticated', () => {
        reflector.get.mockReturnValueOnce(false);

        const context: ExecutionContext = createMock();
        context.switchToHttp().getRequest<DeepMocked<express.Request>>().isAuthenticated.mockReturnValue(true);
        expect(sut.canActivate(context)).toEqual(true);
    });
});
