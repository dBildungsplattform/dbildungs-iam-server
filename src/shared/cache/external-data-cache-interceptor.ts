import { CacheInterceptor } from '@nestjs/cache-manager';
import { ExecutionContext, Injectable, CallHandler } from '@nestjs/common';
import { Observable, from, firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class ExternalDataCacheInterceptor extends CacheInterceptor {
    private inflight = new Map<string, Promise<any>>();

    public override trackBy(context: ExecutionContext): string | undefined {
        const req = context.switchToHttp().getRequest();

        if (req.method !== 'POST' || !req.url.includes('/keycloakinternal/externaldata')) {
            return undefined;
        }

        const bodyHash: string = crypto
            .createHash('sha1')
            .update(JSON.stringify(req.body ?? {}))
            .digest('hex');

        return `kc-externaldata:${bodyHash}`;
    }

    public override async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const key: string | undefined = this.trackBy(context);

        if (!key) {
            return next.handle();
        }

        if (this.inflight.has(key)) {
            return from(this.inflight.get(key)!);
        }

        Reflect.defineMetadata('cache:cacheKey', key, context.getHandler());

        const result$: Observable<any> = await super.intercept(context, next);

        const promise: Promise<unknown> = firstValueFrom(result$);

        this.inflight.set(key, promise);

        await promise.finally(() => {
            this.inflight.delete(key);
        });

        return from(promise);
    }
}
