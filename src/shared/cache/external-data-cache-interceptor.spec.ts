import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as crypto from 'crypto';
import { createMock } from '../../../test/utils/createMock.js';
import { ExternalDataCacheInterceptor } from './external-data-cache-interceptor';
import { ClassLogger } from '../../core/logging/class-logger.js';

describe('ExternalDataCacheInterceptor', () => {
    let module: TestingModule;

    let sut: ExternalDataCacheInterceptor;
    //let cacheMock: DeepMocked<Cache>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                ExternalDataCacheInterceptor,
                {
                    provide: Cache,
                    useValue: createMock(Cache),
                },
                {
                    provide: ClassLogger,
                    useValue: createMock(ClassLogger),
                },
                { provide: CACHE_MANAGER, useValue: { get: vi.fn(), set: vi.fn() } },
            ],
        }).compile();

        sut = module.get(ExternalDataCacheInterceptor);
        //cacheMock = module.get(Cache);
    });

    afterAll(async () => {
        await module.close();
    });

    describe('trackBy', () => {
        it('hashes the request body and prefixes with "kc-externaldata:"', () => {
            const body: object = { a: 1, b: 'x' };
            const ctx: ExecutionContext = {
                switchToHttp: () => ({
                    getRequest: () => ({ body }),
                }),
            } as unknown as ExecutionContext;

            const key: string | undefined = sut.trackBy(ctx);
            const expectedHash: string = crypto.createHash('sha1').update(JSON.stringify(body)).digest('hex');

            expect(key).toBe(`kc-externaldata:${expectedHash}`);
        });

        it('treats undefined body as {}', () => {
            const ctx: ExecutionContext = {
                switchToHttp: () => ({
                    getRequest: () => ({ body: undefined }),
                }),
            } as unknown as ExecutionContext;

            const key: string | undefined = sut.trackBy(ctx);
            const expectedHash: string = crypto.createHash('sha1').update(JSON.stringify({})).digest('hex');

            expect(key).toBe(`kc-externaldata:${expectedHash}`);
        });
    });
});
