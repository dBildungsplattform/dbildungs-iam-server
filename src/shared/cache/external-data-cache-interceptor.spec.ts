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

    describe('intercept', () => {
        it('returns cached value if present', async () => {
            const cachedValue: unknown = { data: 'cached' };
            cacheMock.get.mockResolvedValue(cachedValue);

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
            expect(cacheMock.set).toHaveBeenCalledWith(sut.trackBy(ctx), nextResult, 10_000);
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

        it('joins inflight when concurrent requests share the same key', async () => {
            cacheMock.get.mockResolvedValue(undefined);

            const nextResult: unknown = { data: 'concurrent' };
            const handle: Mock<() => Observable<unknown>> = vi.fn(
                () =>
                    new Observable((subscriber: Subscriber<unknown>) => {
                        setTimeout(() => {
                            subscriber.next(nextResult);
                            subscriber.complete();
                        }, 20);
                    }),
            );
            const next: CallHandler = { handle };

            const ctx: ExecutionContext = {
                switchToHttp: () => ({
                    getRequest: () => ({ body: {} }),
                }),
            } as unknown as ExecutionContext;

            const result$1: Observable<unknown> = await sut.intercept(ctx, next);
            const result$2: Observable<unknown> = await sut.intercept(ctx, next);

            expect(handle).toHaveBeenCalledTimes(1);

            const [r1, r2]: [unknown, unknown] = await Promise.all([
                firstValueFrom(result$1),
                firstValueFrom(result$2),
            ]);
            expect(r1).toEqual(nextResult);
            expect(r2).toEqual(nextResult);

            expect(cacheMock.set).toHaveBeenCalledWith(sut.trackBy(ctx), nextResult, 10_000);
        });

        it('allows subsequent request after inflight completes to call next.handle again', async () => {
            cacheMock.get.mockResolvedValue(undefined);

            const nextResult: unknown = { data: 'sequential' };
            const handle: Mock<() => Observable<unknown>> = vi.fn(
                () =>
                    new Observable((subscriber: Subscriber<unknown>) => {
                        setTimeout(() => {
                            subscriber.next(nextResult);
                            subscriber.complete();
                        }, 10);
                    }),
            );
            const next: CallHandler = { handle };

            const ctx: ExecutionContext = {
                switchToHttp: () => ({
                    getRequest: () => ({ body: {} }),
                }),
            } as unknown as ExecutionContext;

            const result$: Observable<unknown> = await sut.intercept(ctx, next);
            const result: unknown = await firstValueFrom(result$);
            expect(result).toEqual(nextResult);

            cacheMock.get.mockResolvedValue(undefined);

            const result2$: Observable<unknown> = await sut.intercept(ctx, next);
            const result2: unknown = await firstValueFrom(result2$);
            expect(result2).toEqual(nextResult);

            expect(handle).toHaveBeenCalledTimes(2);
        });
    });
});
