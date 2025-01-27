import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import express from 'express';
import { AccessApiKeyGuard } from './access.apikey.guard.js';

describe('The access apikey guard', () => {
    let reflector: DeepMocked<Reflector>;
    let sut: AccessApiKeyGuard;

    beforeEach(() => {
        reflector = createMock<Reflector>();
        sut = new AccessApiKeyGuard(reflector);

        jest.spyOn(AccessApiKeyGuard.prototype, 'canActivate').mockImplementation(() => {
            return true;
        });
    });

    it('should allow activation if request authenticated', () => {
        reflector.get.mockReturnValueOnce(false);

        const context: ExecutionContext = createMock();
        context.switchToHttp().getRequest<DeepMocked<express.Request>>().isAuthenticated.mockReturnValue(true);
        expect(sut.canActivate(context)).toEqual(true);
    });

    it('should call super.canActivate if request is not authenticated', async () => {
        reflector.get.mockReturnValueOnce(false);

        const context: ExecutionContext = createMock();
        context.switchToHttp().getRequest<DeepMocked<express.Request>>().isAuthenticated.mockReturnValue(false);
        const superCanActivateSpy: jest.SpyInstance = jest.spyOn(AccessApiKeyGuard.prototype, 'canActivate');
        await sut.canActivate(context);

        expect(superCanActivateSpy).toHaveBeenCalledWith(context);
    });
});
