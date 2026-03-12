import { ExecutionContext, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { AbstractHttpAdapter } from '@nestjs/core';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Injectable()
export class ExternalDataCacheInterceptor extends CacheInterceptor {
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
}
