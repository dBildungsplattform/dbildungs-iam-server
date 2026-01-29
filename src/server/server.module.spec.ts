import { Test, TestingModule } from '@nestjs/testing';
import { Issuer } from 'openid-client';
import { ServerModule } from './server.module.js';
import { OIDC_CLIENT } from '../modules/authentication/services/oidc-client.service.js';
import { MiddlewareConsumer } from '@nestjs/common';
import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { RedisClientType } from 'redis';
import { ConfigTestModule, LoggingTestModule } from '../../test/utils/index.js';

Mock('redis', () => ({
    createClient: (): RedisClientType => createMock(RedisClientType),
}));

describe('ServerModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ServerModule, ConfigTestModule, LoggingTestModule],
        })
            .overrideProvider(OIDC_CLIENT)
            .useValue(
                new new Issuer({
                    issuer: 'oidc',
                    jwks_uri: 'https://keycloak.example.com/nothing',
                }).Client({ client_id: 'DummyId' }),
            )
            .compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    it('should run its configure method', async () => {
        expect(module.get(ServerModule)).toBeDefined();
        const consumer: MiddlewareConsumer = createMock(MiddlewareConsumer);
        await module.get(ServerModule).configure(consumer);

        expect(consumer.apply).toHaveBeenCalled();
    });
});
