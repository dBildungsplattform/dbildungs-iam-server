import { Test, TestingModule } from '@nestjs/testing';
import { Issuer } from 'openid-client';

import { OIDC_CLIENT } from '../modules/frontend/auth/oidc-client.service.js';
import { BackendForFrontendModule } from './backend-for-frontend.module.js';

describe('FrontendModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [BackendForFrontendModule],
        })
            .overrideProvider(OIDC_CLIENT)
            .useValue(new new Issuer({ issuer: 'oidc' }).Client({ client_id: 'DummyId' }))
            .compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });
});
