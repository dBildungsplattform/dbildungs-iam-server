import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

import { OIDC_CLIENT } from '../modules/frontend/auth/oidc-client.service.js';
import { OpenIdConnectStrategy } from '../modules/frontend/auth/oidc.strategy.js';
import { BackendForFrontendModule } from './backend-for-frontend.module.js';

describe('FrontendModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [BackendForFrontendModule],
        })
            .overrideProvider(OIDC_CLIENT)
            .useValue(createMock())
            .overrideProvider(OpenIdConnectStrategy)
            .useValue(createMock())
            .compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });
});
