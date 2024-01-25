import { Test, TestingModule } from '@nestjs/testing';
import { Issuer } from 'openid-client';
import { ServerModule } from './server.module.js';
import { OIDC_CLIENT } from '../modules/authentication/services/oidc-client.service.js';

describe('ServerModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ServerModule],
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
