import { Response } from 'express';
import { Observable, map } from 'rxjs';
import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { PagedResponse } from './paged.response.js';
import { PagingHeaders } from './paging.enums.js';

export class GlobalPagingHeadersInterceptor implements NestInterceptor {
    public intercept(context: ExecutionContext, next: CallHandler<unknown>): Observable<unknown | unknown[]> {
        return next.handle().pipe(
            map((value: unknown) => {
                if (value instanceof PagedResponse) {
                    const response: Response = context.switchToHttp().getResponse();

                    GlobalPagingHeadersInterceptor.setPaginationHeaders(response, value);

                    return value.items as unknown[];
                }

                return value;
            }),
        );
    }

    private static setPaginationHeaders<T>(response: Response, payload: PagedResponse<T>): void {
        response.setHeader(PagingHeaders.OFFSET, payload.offset);
        response.setHeader(PagingHeaders.LIMIT, payload.limit);
        response.setHeader(PagingHeaders.TOTAL, payload.total);
    }
}
