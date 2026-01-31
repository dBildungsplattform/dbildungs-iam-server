import { Test, TestingModule } from '@nestjs/testing';
import { Issuer } from 'openid-client';
import { ServerModule } from './server.module.js';
import { OIDC_CLIENT } from '../modules/authentication/services/oidc-client.service.js';
import { MiddlewareConsumer } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { ConfigTestModule, LoggingTestModule } from '../../test/utils/index.js';

function createRedisClientMock(overrides?: Partial<RedisClientType>): RedisClientType {
    return {
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        get: vi.fn(),
        set: vi.fn(),
        on: vi.fn().mockReturnThis(),
        ...overrides,
    } as RedisClientType;
}

vi.mock('redis', () => ({
    createClient: (): RedisClientType => createRedisClientMock(),
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
        if (module) {
            await module.close();
        }
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    it('should run its configure method', async () => {
        expect(module.get(ServerModule)).toBeDefined();
        const consumer: MiddlewareConsumer = vi.mockObject({
            apply: vi.fn().mockReturnValue({
                forRoutes: vi.fn(), // <- this allows the chaining
            }),
        });
        await module.get(ServerModule).configure(consumer);

        expect(consumer.apply).toHaveBeenCalled();
    });
});
