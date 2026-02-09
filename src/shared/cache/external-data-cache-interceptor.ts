import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { ExecutionContext, Injectable, CallHandler, NestInterceptor, Inject } from '@nestjs/common';
import { Observable, from, firstValueFrom, of } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class ExternalDataCacheInterceptor implements NestInterceptor {
    private inflight: Map<string, Promise<any>> = new Map<string, Promise<any>>();

    public constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {
        console.log('[ExternalDataCacheInterceptor] constructor');
    }

    public trackBy(context: ExecutionContext): string | undefined {
        const req = context.switchToHttp().getRequest();

        const bodyHash: string = crypto
            .createHash('sha1')
            .update(JSON.stringify(req.body ?? {}))
            .digest('hex');

        return `kc-externaldata:${bodyHash}`;
    }

    public async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const key: string | undefined = this.trackBy(context);

        if (!key) {
            return next.handle();
        }

        const cached = await this.cache.get(key);
        if (cached !== undefined) {
            console.log('[CACHE HIT]', key);
            return of(cached);
        }

        const inflight: Promise<any> | undefined = this.inflight.get(key);
        if (inflight) {
            console.log('[INFLIGHT JOIN]', key);
            return from(inflight);
        }

        console.log('[CACHE MISS]', key);

        //Reflect.defineMetadata('cache:cacheKey', key, context.getHandler());
        //const result$: Observable<any> = await super.intercept(context, next);

        const promise: Promise<unknown> = firstValueFrom(next.handle());

        this.inflight.set(key, promise);

        console.log('Cache key:', key);
        console.log('Inflight keys:', this.inflight.size);

        void promise.then((value) => this.cache.set(key, value, 10_000)).finally(() => this.inflight.delete(key));

        return from(promise);
    }
}
