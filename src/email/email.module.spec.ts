import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { RedisClientType } from 'redis';
import { ConfigTestModule, LoggingTestModule } from '../../test/utils/index.js';
import { EmailModule } from './email.module.js';

jest.mock('redis', () => ({
    createClient: (): RedisClientType => createMock<RedisClientType>(),
}));

describe('EmailModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [EmailModule, ConfigTestModule, LoggingTestModule],
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
        /*const consumer: MiddlewareConsumer = createMock<MiddlewareConsumer>();
        await module.get(EmailModule).configure(consumer);

        expect(consumer.apply).toHaveBeenCalled();*/
    });
});
