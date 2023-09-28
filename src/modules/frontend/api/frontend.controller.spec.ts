import { Test, TestingModule } from '@nestjs/testing';

import { FrontendController } from './frontend.controller.js';

describe('FrontendController', () => {
    let module: TestingModule;
    let frontendController: FrontendController;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [FrontendController],
        }).compile();

        frontendController = module.get(FrontendController);
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(frontendController).toBeDefined();
    });

    describe('Login', () => {
        it('should not throw', () => {
            const loginResponse: string = frontendController.login();

            expect(loginResponse).toBe('Login!');
        });
    });

    describe('Logout', () => {
        it('should not throw', () => {
            const loginResponse: string = frontendController.logout();

            expect(loginResponse).toBe('Logout!');
        });
    });
});
