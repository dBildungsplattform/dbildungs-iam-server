import { CACHE_MANAGER, Cache, CacheInterceptor } from '@nestjs/cache-manager';
import { ExecutionContext, Injectable, CallHandler, Inject } from '@nestjs/common';
import { Observable, from, firstValueFrom, of } from 'rxjs';
import * as crypto from 'crypto';
import { ClassLogger } from '../../core/logging/class-logger.js';
import { AbstractHttpAdapter, Reflector } from '@nestjs/core';

@Injectable()
export class ExternalDataCacheInterceptor extends CacheInterceptor {
    public constructor(
        @Inject(CACHE_MANAGER) private readonly cache: Cache,
        protected override readonly reflector: Reflector,
        private readonly logger: ClassLogger,
    ) {
        super(cache, reflector);
        logger.info('[ExternalDataCacheInterceptor] constructor');
    }

    public override trackBy(context: ExecutionContext): string | undefined {
        const request: Request = context.switchToHttp().getRequest<Request>();
        const httpAdapter: AbstractHttpAdapter | undefined = this.httpAdapterHost?.httpAdapter;
        if (!httpAdapter) {
            return undefined;
        }

        const requestUrl: string = String(httpAdapter.getRequestUrl(request));
        const bodyHash: string = crypto
            .createHash('sha256')
            .update(JSON.stringify(request.body ?? {}))
            .digest('hex');

        return `${requestUrl}:${bodyHash}`;
    }

    public override async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
        const key: string | undefined = this.trackBy(context);

        if (!key) {
            return next.handle();
        }

        const cached: unknown = await this.cache.get(key);
        if (cached !== undefined) {
            this.logger.info('[CACHE HIT]', key);
            return of(cached);
        }

        this.logger.info('[CACHE MISS]', key);

        const promise: Promise<unknown> = firstValueFrom(next.handle());

        this.logger.info('Cache key:', key);

        void promise.then((value: unknown) => this.cache.set(key, value));

        return from(promise);
    }
}
