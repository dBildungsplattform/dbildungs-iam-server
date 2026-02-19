import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { ExecutionContext, Injectable, CallHandler, NestInterceptor, Inject } from '@nestjs/common';
import { Observable, from, firstValueFrom, of } from 'rxjs';
import * as crypto from 'crypto';
import { ClassLogger } from '../../core/logging/class-logger.js';

@Injectable()
export class ExternalDataCacheInterceptor implements NestInterceptor {
    private inflight: Map<string, Promise<unknown>> = new Map<string, Promise<unknown>>();

    public constructor(
        @Inject(CACHE_MANAGER) private readonly cache: Cache,
        private readonly logger: ClassLogger,
    ) {
        logger.debug('[ExternalDataCacheInterceptor] constructor');
    }

    public trackBy(context: ExecutionContext): string | undefined {
        const req: Request = context.switchToHttp().getRequest();

        const bodyHash: string = crypto
            .createHash('sha256')
            .update(JSON.stringify(req.body ?? {}))
            .digest('hex');

        return `kc-externaldata:${bodyHash}`;
    }

    public async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
        const key: string | undefined = this.trackBy(context);

        if (!key) {
            return next.handle();
        }

        const cached: unknown = await this.cache.get(key);
        if (cached !== undefined) {
            this.logger.debug('[CACHE HIT]', key);
            return of(cached);
        }

        const inflight: Promise<unknown> | undefined = this.inflight.get(key);
        if (inflight) {
            this.logger.debug('[INFLIGHT JOIN]', key);
            return from(inflight);
        }

        this.logger.debug('[CACHE MISS]', key);

        const promise: Promise<unknown> = firstValueFrom(next.handle());

        this.inflight.set(key, promise);

        this.logger.debug('Cache key:', key);
        this.logger.debug('Inflight keys:', this.inflight.size);

        void promise
            .then((value: unknown) => this.cache.set(key, value, 10_000))
            .finally(() => this.inflight.delete(key)); // 10 seconds TTL

        return from(promise);
    }
}
