import { Observable, map } from 'rxjs';
import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { setPaginationHeaders } from './helpers.js';
import { PagedResponse } from './paged.response.js';
import { Response } from 'express';

export class GlobalPaginationHeadersInterceptor implements NestInterceptor {
    public intercept(context: ExecutionContext, next: CallHandler<unknown>): Observable<unknown | unknown[]> {
        return next.handle().pipe(
            map((value: unknown) => {
                if (value instanceof PagedResponse) {
                    const response: Response = context.switchToHttp().getResponse();

                    setPaginationHeaders(response, value);

                    return value.items as unknown[];
                }

                return value;
            }),
        );
    }
}
