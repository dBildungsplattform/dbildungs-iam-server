import { Response } from 'express';
import { PagedResponse } from './paged.response.js';

export function setPaginationHeaders<T>(response: Response, payload: PagedResponse<T>): void {
    response.setHeader('Pagination-Total', payload.total);
    response.setHeader('Pagination-Offset', payload.offset);
    response.setHeader('Pagination-Limit', payload.limit);
}
