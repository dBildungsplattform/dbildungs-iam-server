import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisClientType } from 'redis';
import { ConfigTestModule, DatabaseTestModule, LoggingTestModule } from '../../test/utils/index.js';
import { EmailModule } from './email.module.js';

function createRedisClientMock(overrides?: Partial<RedisClientType>): RedisClientType {
    return {
        connect: vi.fn(),
        disconnect: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        ...overrides,
    } as RedisClientType;
}

vi.mock('redis', () => ({
    createClient: (): RedisClientType => createRedisClientMock(),
}));

describe('EmailModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [EmailModule, ConfigTestModule, LoggingTestModule, DatabaseTestModule.forRoot()],
        }).compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    it('should run its configure method', () => {
        expect(module.get(EmailModule)).toBeDefined();
    });
});
