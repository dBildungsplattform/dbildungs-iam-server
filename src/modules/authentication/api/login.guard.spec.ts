import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard, IAuthGuard } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';

import { LoginGuard } from './login.guard.js';

const canActivateSpy: jest.SpyInstance = jest.spyOn(AuthGuard(['jwt', 'oidc']).prototype as IAuthGuard, 'canActivate');
const logInSpy: jest.SpyInstance = jest.spyOn(AuthGuard(['jwt', 'oidc']).prototype as IAuthGuard, 'logIn');

describe('LoginGuard', () => {
    let module: TestingModule;
    let sut: LoginGuard;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [LoginGuard],
        }).compile();

        sut = module.get(LoginGuard);
    }, 30 * 1_000);

    afterAll(async () => {
        await module.close();
    }, 30 * 1_000);

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('canActivate', () => {
        it('should call canActivate of superclass', async () => {
            canActivateSpy.mockResolvedValueOnce(true);
            logInSpy.mockResolvedValueOnce(undefined);
            const contextMock: DeepMocked<ExecutionContext> = createMock();
            contextMock.switchToHttp().getRequest<DeepMocked<Request>>().isAuthenticated.mockReturnValue(false);

            await sut.canActivate(contextMock);

            expect(canActivateSpy).toHaveBeenCalledWith(contextMock);
        });

        it('should call logIn of superclass', async () => {
            canActivateSpy.mockResolvedValueOnce(true);
            logInSpy.mockResolvedValueOnce(undefined);
            const contextMock: DeepMocked<ExecutionContext> = createMock();
            contextMock.switchToHttp().getRequest<DeepMocked<Request>>().isAuthenticated.mockReturnValue(false);

            await sut.canActivate(contextMock);

            expect(logInSpy).toHaveBeenCalledWith(contextMock.switchToHttp().getRequest());
        });

        it('should save returnUrl to session if it exists', async () => {
            canActivateSpy.mockResolvedValueOnce(true);
            logInSpy.mockResolvedValueOnce(undefined);
            const contextMock: DeepMocked<ExecutionContext> = createMock();
            const redirectUrl: string = faker.internet.url();
            contextMock.switchToHttp().getRequest<Request>().query = { redirectUrl };

            await sut.canActivate(contextMock);

            expect(contextMock.switchToHttp().getRequest<Request>().session.redirectUrl).toBe(redirectUrl);
        });

        it('should ignore errors in super.canActivate', async () => {
            canActivateSpy.mockRejectedValueOnce(new Error());
            logInSpy.mockResolvedValueOnce(undefined);
            const contextMock: DeepMocked<ExecutionContext> = createMock();

            await expect(sut.canActivate(contextMock)).resolves.toBe(true);
        });

        it('should ignore errors in super.logIn', async () => {
            canActivateSpy.mockResolvedValueOnce(true);
            logInSpy.mockRejectedValueOnce(new Error());
            const contextMock: DeepMocked<ExecutionContext> = createMock();

            await expect(sut.canActivate(contextMock)).resolves.toBe(true);
        });
    });
});
