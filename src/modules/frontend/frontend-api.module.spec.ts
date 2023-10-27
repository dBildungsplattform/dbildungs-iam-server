import { Test, TestingModule } from '@nestjs/testing';

import { createMock } from '@golevelup/ts-jest';
import { ConfigTestModule, DatabaseTestModule, MapperTestModule } from '../../../test/utils/index.js';
import { FrontendController } from './api/frontend.controller.js';
import { OIDC_CLIENT } from './auth/oidc-client.service.js';
import { FrontendApiModule } from './frontend-api.module.js';
import { OpenIdConnectStrategy } from './auth/oidc.strategy.js';

describe('FrontendApiModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot(), MapperTestModule, FrontendApiModule],
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

    describe('when module is initialized', () => {
        it('should resolve FrontendController', () => {
            expect(module.get(FrontendController)).toBeInstanceOf(FrontendController);
        });
    });
});
