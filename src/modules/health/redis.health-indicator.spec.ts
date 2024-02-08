import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HealthIndicatorResult, HealthIndicatorStatus } from '@nestjs/terminus';
import { ConfigTestModule } from '../../../test/utils/index.js';
import { RedisHealthIndicator } from './redis.health-indicator.js';
import { RedisClientOptions, RedisClientType } from 'redis';
import EventEmitter from 'node:events';

let redisClient: DeepMocked<RedisClientType>;
const clientEventEmitter: EventEmitter = new EventEmitter();

jest.mock('redis', () => {
    return {
        createClient: function (_options: RedisClientOptions): RedisClientType {
            redisClient = createMock<RedisClientType>();

            redisClient.on.mockImplementation((eventName: string | symbol, listener: (...args: unknown[]) => void) => {
                clientEventEmitter.on(eventName, listener);
                return redisClient;
            });

            return redisClient;
        },
    };
});

describe('Redis health indicator', () => {
    let module: TestingModule;
    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule],
            providers: [RedisHealthIndicator],
        }).compile();
    });

    it('should report a successful connection to redis as the service being up', async () => {
        const redisHI: RedisHealthIndicator = module.get<RedisHealthIndicator>(RedisHealthIndicator);

        redisClient.connect.mockImplementation(() => {
            const result: Promise<RedisClientType> = new Promise<RedisClientType>(
                (resolve: (value: PromiseLike<RedisClientType> | RedisClientType) => void) =>
                    clientEventEmitter.on('ready', resolve),
            );
            clientEventEmitter.emit('ready');
            return result;
        });

        const checkResult: HealthIndicatorResult = await redisHI.check();
        expect(checkResult['Redis']).toBeDefined();
        expect(checkResult['Redis']?.status).toBe('up');
    });

    it('should report a failed connection to redis as the service being down and showing the error message in the status', async () => {
        const error: Error = new Error('Because reasons');
        const redisHI: RedisHealthIndicator = module.get<RedisHealthIndicator>(RedisHealthIndicator);

        redisClient.connect.mockImplementation(() => {
            const result: Promise<RedisClientType> = new Promise<RedisClientType>(
                (resolve: (value: PromiseLike<RedisClientType> | RedisClientType) => void) =>
                    clientEventEmitter.on('error', resolve),
            );
            clientEventEmitter.emit('error', error);
            return result;
        });

        const checkResult: { status: HealthIndicatorStatus; [options: string]: string } | undefined = await redisHI
            .check()
            .then((r: HealthIndicatorResult) => r['Redis']);
        expect(checkResult).toBeDefined();
        expect(checkResult?.status).toBe('down');
        expect(checkResult?.['message']).toBe('Redis does not seem to be up: Because reasons');
    });
});
