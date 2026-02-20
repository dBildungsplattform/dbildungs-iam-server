import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as crypto from 'crypto';
import { Observable, Subscriber, firstValueFrom } from 'rxjs';
import { Mock } from 'vitest';
import { DeepMocked, createMock } from '../../../test/utils/createMock.js';
import { ClassLogger } from '../../core/logging/class-logger.js';
import { ExternalDataCacheInterceptor } from './external-data-cache-interceptor';

describe('ExternalDataCacheInterceptor', () => {
    let module: TestingModule;

    let sut: ExternalDataCacheInterceptor;
    let cacheMock: DeepMocked<Cache>;

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
        cacheMock = module.get(CACHE_MANAGER);
    });

    afterAll(async () => {
        await module.close();
    });

    describe('trackBy', () => {
        it('hashes the request body', () => {
            const body: object = { a: 1, b: 'x' };
            const url: string = '/test';

            Object.defineProperty(sut, 'httpAdapterHost', {
                value: { httpAdapter: { getRequestUrl: () => url } },
                configurable: true,
                writable: true,
            });

            const ctx: ExecutionContext = {
                switchToHttp: () => ({
                    getRequest: () => ({ body }),
                }),
            } as unknown as ExecutionContext;

            const key: string | undefined = sut.trackBy(ctx);
            const expectedHash: string = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');

            expect(key).toBe(`${url}:${expectedHash}`);
        });

        it('returns undefined if httpAdapter is not available', () => {
            const ctx: ExecutionContext = {
                switchToHttp: () => ({
                    getRequest: () => ({ body: {} }),
                }),
            } as unknown as ExecutionContext;

            const key: string | undefined = sut.trackBy(ctx);

            expect(key).toBeUndefined();
        });

        it('treats undefined body as {}', () => {
            const url: string = '/test';

            Object.defineProperty(sut, 'httpAdapterHost', {
                value: { httpAdapter: { getRequestUrl: () => url } },
                configurable: true,
                writable: true,
            });

            const ctx: ExecutionContext = {
                switchToHttp: () => ({
                    getRequest: () => ({ body: undefined }),
                }),
            } as unknown as ExecutionContext;

            const key: string | undefined = sut.trackBy(ctx);
            const expectedHash: string = crypto.createHash('sha256').update(JSON.stringify({})).digest('hex');

            expect(key).toBe(`${url}:${expectedHash}`);
        });
    });

    describe('intercept', () => {
        it('returns cached value if present', async () => {
            const cachedValue: unknown = { data: 'cached' };
            cacheMock.get.mockResolvedValue(cachedValue);

            const url: string = '/test';

            Object.defineProperty(sut, 'httpAdapterHost', {
                value: { httpAdapter: { getRequestUrl: () => url } },
                configurable: true,
                writable: true,
            });

            const ctx: ExecutionContext = {
                switchToHttp: () => ({
                    getRequest: () => ({ body: {} }),
                }),
            } as unknown as ExecutionContext;

            const result$: Observable<unknown> = await sut.intercept(ctx, {} as CallHandler);
            const result: unknown = await firstValueFrom(result$);

            expect(cacheMock.get).toHaveBeenCalledWith(sut.trackBy(ctx));
            expect(result).toEqual(cachedValue);
        });

        it('calls next.handle() and caches result on cache miss', async () => {
            cacheMock.get.mockResolvedValue(undefined);

            const url: string = '/test';

            Object.defineProperty(sut, 'httpAdapterHost', {
                value: { httpAdapter: { getRequestUrl: () => url } },
                configurable: true,
                writable: true,
            });

            const nextResult: unknown = { data: 'fresh' };
            const next: CallHandler = {
                handle: () =>
                    new Observable((subscriber: Subscriber<unknown>) => {
                        subscriber.next(nextResult);
                        subscriber.complete();
                    }),
            };

            const ctx: ExecutionContext = {
                switchToHttp: () => ({
                    getRequest: () => ({ body: {} }),
                }),
            } as unknown as ExecutionContext;

            const result$: Observable<unknown> = await sut.intercept(ctx, next);
            const result: unknown = await firstValueFrom(result$);

            expect(cacheMock.get).toHaveBeenCalledWith(sut.trackBy(ctx));
            expect(cacheMock.set).toHaveBeenCalledWith(sut.trackBy(ctx), nextResult);
            expect(result).toEqual(nextResult);
        });

        it('calls next.handle() when trackBy returns undefined', async () => {
            const nextResult: unknown = { data: 'no-key' };
            const handle: Mock<() => Observable<unknown>> = vi.fn(
                () =>
                    new Observable((subscriber: Subscriber<unknown>) => {
                        subscriber.next(nextResult);
                        subscriber.complete();
                    }),
            );
            const next: CallHandler = { handle };

            vi.spyOn(sut, 'trackBy').mockReturnValueOnce(undefined);

            const ctx: ExecutionContext = {
                switchToHttp: () => ({
                    getRequest: () => ({ body: {} }),
                }),
            } as unknown as ExecutionContext;

            const result$: Observable<unknown> = await sut.intercept(ctx, next);
            const result: unknown = await firstValueFrom(result$);

            expect(handle).toHaveBeenCalled();
            expect(result).toEqual(nextResult);
        });
    });
});
