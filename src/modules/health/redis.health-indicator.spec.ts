import { Test, TestingModule } from '@nestjs/testing';
import { DeepMocked } from '../../../test/utils/createMock.js';
import { HealthIndicatorResult, HealthIndicatorStatus } from '@nestjs/terminus';
import { ConfigTestModule } from '../../../test/utils/index.js';
import { ValkeyHealthIndicator } from './redis.health-indicator.js';
import { RedisClientOptions, RedisClientType } from 'redis';
import EventEmitter from 'node:events';

const redisClient: DeepMocked<RedisClientType> = {
    on: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any as DeepMocked<RedisClientType>;
const clientEventEmitter: EventEmitter = new EventEmitter();

vi.mock('redis', () => {
    return {
        createClient: function (_options: RedisClientOptions): RedisClientType {
            redisClient.on.mockImplementation((eventName: string | symbol, listener: (...args: unknown[]) => void) => {
                clientEventEmitter.on(eventName, listener);
                return redisClient;
            });

            return redisClient;
        },
    };
});

describe('Valkey health indicator', () => {
    let module: TestingModule;
    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule],
            providers: [ValkeyHealthIndicator],
        }).compile();
    });

    it('should report a successful connection to redis as the service being up', async () => {
        const valkeyHI: ValkeyHealthIndicator = module.get<ValkeyHealthIndicator>(ValkeyHealthIndicator);

        redisClient.connect.mockImplementation(() => {
            const result: Promise<RedisClientType> = new Promise<RedisClientType>(
                (resolve: (value: PromiseLike<RedisClientType> | RedisClientType) => void) => {
                    clientEventEmitter.on('ready', resolve);
                },
            );
            clientEventEmitter.emit('ready');
            return result;
        });

        const checkResult: HealthIndicatorResult = await valkeyHI.check();
        expect(checkResult['Valkey']).toBeDefined();
        expect(checkResult['Valkey']?.status).toBe('up');
    });

    it('should report a failed connection to valkey as the service being down and showing the error message in the status', async () => {
        const error: Error = new Error('Because reasons');
        const valkeyHI: ValkeyHealthIndicator = module.get<ValkeyHealthIndicator>(ValkeyHealthIndicator);

        redisClient.connect.mockImplementation(() => {
            const result: Promise<RedisClientType> = new Promise<RedisClientType>(
                (resolve: (value: PromiseLike<RedisClientType> | RedisClientType) => void) => {
                    clientEventEmitter.on('error', resolve);
                },
            );
            clientEventEmitter.emit('error', error);
            return result;
        });

        const checkResult: { status: HealthIndicatorStatus; [options: string]: string } | undefined = await valkeyHI
            .check()
            .then((r: HealthIndicatorResult) => r['Valkey']);
        expect(checkResult).toBeDefined();
        expect(checkResult?.status).toBe('down');
        expect(checkResult?.['message']).toBe('Valkey does not seem to be up: Because reasons');
    });

    it('should report an exception as the service being down and showing the error message in the status', async () => {
        const valkeyHI: ValkeyHealthIndicator = module.get<ValkeyHealthIndicator>(ValkeyHealthIndicator);

        redisClient.connect.mockImplementation(() => {
            throw new Error('Connection failed');
        });

        const checkResult: { status: HealthIndicatorStatus; [options: string]: string } | undefined = await valkeyHI
            .check()
            .then((r: HealthIndicatorResult) => r['Valkey']);
        expect(checkResult).toBeDefined();
        expect(checkResult?.status).toBe('down');
        expect(checkResult?.['message']).toBe('Exception while making connection: Error: Connection failed');
    });
});
