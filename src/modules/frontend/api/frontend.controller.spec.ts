import { faker } from '@faker-js/faker/';
import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { SessionData } from 'express-session';
import { UserinfoResponse } from 'openid-client';

import { ConfigTestModule } from '../../../../test/utils/config-test.module.js';
import { User } from '../auth/user.decorator.js';
import { FrontendController } from './frontend.controller.js';

describe('FrontendController', () => {
    let module: TestingModule;
    let frontendController: FrontendController;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule],
            providers: [FrontendController],
        }).compile();

        frontendController = module.get(FrontendController);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(frontendController).toBeDefined();
    });

    describe('Login', () => {
        it('should redirect', () => {
            const responseMock: Response = createMock<Response>();
            const session: SessionData = { cookie: { originalMaxAge: 0 } };

            frontendController.login(responseMock, session);

            expect(responseMock.redirect).toHaveBeenCalled();
        });

        it('should redirect to saved redirectUrl', () => {
            const responseMock: Response = createMock<Response>();
            const sessionMock: SessionData = createMock<SessionData>({ redirectUrl: faker.internet.url() });

            frontendController.login(responseMock, sessionMock);

            expect(responseMock.redirect).toHaveBeenCalledWith(sessionMock.redirectUrl);
        });

        it('should clear redirectUrl from session', () => {
            const responseMock: Response = createMock<Response>();
            const session: SessionData = { redirectUrl: faker.internet.url(), cookie: { originalMaxAge: 0 } };

            frontendController.login(responseMock, session);

            expect(session.redirectUrl).toBeUndefined();
        });
    });

    describe('Logout', () => {
        it('should delete session', () => {
            const requestMock: Request = createMock<Request>({ session: createMock<SessionData>() });

            frontendController.logout(requestMock);

            expect(requestMock.session.destroy).toHaveBeenCalled();
        });
    });

    describe('info', () => {
        it('should return user info', () => {
            const user: User = createMock<User>({ userinfo: createMock<UserinfoResponse>() });

            const result: UserinfoResponse = frontendController.info(user);

            expect(result).toBe(user.userinfo);
        });
    });
});
