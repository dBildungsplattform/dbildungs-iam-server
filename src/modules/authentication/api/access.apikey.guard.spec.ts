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
    });

    it('should allow activation if request authenticated', () => {
        reflector.get.mockReturnValueOnce(false);

        const context: ExecutionContext = createMock();
        context.switchToHttp().getRequest<DeepMocked<express.Request>>().isAuthenticated.mockReturnValue(true);
        expect(sut.canActivate(context)).toEqual(true);
    });

});
