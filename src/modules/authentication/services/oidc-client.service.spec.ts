import { Test, TestingModule } from '@nestjs/testing';
import { Client } from 'openid-client';

import { ConfigTestModule, KeycloakConfigTestModule } from '../../../../test/utils/index.js';
import { OIDCClientProvider, OIDC_CLIENT } from './oidc-client.service.js';

Mock('openid-client', () => ({
    Issuer: {
        discover: vi.fn(() => Promise.resolve({ Client: Object })),
    },
}));

describe('OIDCClientProvider', () => {
    let module: TestingModule;
    let sut: Client;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [KeycloakConfigTestModule.forRoot(), ConfigTestModule],
            providers: [OIDCClientProvider],
        }).compile();

        sut = module.get(OIDC_CLIENT);
    });

    afterAll(async () => {
        await module.close();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });
});
