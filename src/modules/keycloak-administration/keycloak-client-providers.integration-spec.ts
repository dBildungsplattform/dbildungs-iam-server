import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakAdminClient } from '@s3pweb/keycloak-admin-client-cjs';
import { TokenSet } from 'openid-client';
import { Mock } from 'vitest';

import { ConfigTestModule, KeycloakConfigTestModule } from '../../../test/utils/index.js';
import { KC_SERVICE_CLIENT, KeycloakServiceApiClient } from './keycloak-client-providers.js';

describe('Keycloak API Clients', () => {
    let module: TestingModule;

    let serviceClient: KeycloakAdminClient;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, KeycloakConfigTestModule.forRoot({ isKeycloakRequired: true })],
            providers: [KeycloakServiceApiClient],
        }).compile();

        serviceClient = module.get(KC_SERVICE_CLIENT);
    }, 10000000);

    it('should get access token', async () => {
        const accessToken: string | undefined = await serviceClient.getAccessToken();

        expect(accessToken).toBeDefined();
    });

    it('should get another access token after the first has expired', async () => {
        const tokenSetExpiredSpy: Mock<() => boolean> = vi.spyOn(TokenSet.prototype, 'expired');

        const firstAccessToken: string | undefined = await serviceClient.getAccessToken();

        tokenSetExpiredSpy.mockReturnValueOnce(true);

        const secondAccessToken: string | undefined = await serviceClient.getAccessToken();

        expect(firstAccessToken).toBeDefined();
        expect(secondAccessToken).toBeDefined();
        expect(firstAccessToken).not.toBe(secondAccessToken);
    });
});
