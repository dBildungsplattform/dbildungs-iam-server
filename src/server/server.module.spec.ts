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

// Need to mock mikro-orm otherwise the test fails because src/**/**.entities.ts cannot be transpiled since they are imported by the module at run time
vi.mock('@mikro-orm/nestjs', async () => {
    const actual: Record<string, unknown> = await vi.importActual('@mikro-orm/nestjs');

    const { MikroORM, EntityManager }: typeof import('@mikro-orm/core') = await import('@mikro-orm/core');
    const { SqlEntityManager }: typeof import('@mikro-orm/postgresql') = await import('@mikro-orm/postgresql');
    type SqlEntityManagerType = import('@mikro-orm/postgresql').SqlEntityManager;

    const mockEntityManager: Partial<SqlEntityManagerType> = {};

    const mockMikroORM: Partial<InstanceType<typeof MikroORM>> = {
        em: mockEntityManager as SqlEntityManagerType,
        close: vi.fn(),
        getMetadata: vi.fn(),
    };

    const mikroOrmModule: object =
        typeof actual['MikroOrmModule'] === 'object' && actual['MikroOrmModule'] !== null
            ? actual['MikroOrmModule']
            : {};

    return {
        ...actual,
        MikroOrmModule: {
            ...mikroOrmModule,
            forRootAsync: vi.fn().mockReturnValue({
                module: class MockMikroOrmModule {},
                providers: [
                    { provide: MikroORM, useValue: mockMikroORM },
                    { provide: EntityManager, useValue: mockEntityManager },
                    { provide: SqlEntityManager, useValue: mockEntityManager },
                ],
                exports: [MikroORM, EntityManager, SqlEntityManager],
                global: true,
            }),
        },
    };
});

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
                forRoutes: vi.fn(),
            }),
        });
        await module.get(ServerModule).configure(consumer);

        expect(consumer.apply).toHaveBeenCalled();
    });
});
