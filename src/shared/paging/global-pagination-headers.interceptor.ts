import { Observable, map } from 'rxjs';
import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { PagedResponse } from './paged.response.js';
import { Response } from 'express';

export class GlobalPaginationHeadersInterceptor implements NestInterceptor {
    public intercept(context: ExecutionContext, next: CallHandler<unknown>): Observable<unknown | unknown[]> {
        return next.handle().pipe(
            map((value: unknown) => {
                if (value instanceof PagedResponse) {
                    const response: Response = context.switchToHttp().getResponse();

                    GlobalPaginationHeadersInterceptor.setPaginationHeaders(response, value);

                    return value.items as unknown[];
                }

                return value;
            }),
        );
    }

    private static setPaginationHeaders<T>(response: Response, payload: PagedResponse<T>): void {
        response.setHeader('Pagination-Total', payload.total);
        response.setHeader('Pagination-Offset', payload.offset);
        response.setHeader('Pagination-Limit', payload.limit);
    }
}
