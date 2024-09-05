import { HeadersObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

export enum PagingHeaders {
    OFFSET = 'X-Paging-Offset',
    LIMIT = 'X-Paging-Limit',
    TOTAL = 'X-Paging-Total',
    ITEMS_COUNT = 'X-Paging-ItemsCount',
}

export const PagingHeadersObject: HeadersObject = {
    'X-Paging-Offset': {
        description: 'The offset of the first item from the list. List starts with index 0.',
    },
    'X-Paging-Limit': {
        description: 'The maximum amount of items returned in one request.',
    },
    'X-Paging-Total': {
        description: 'The total amount of items in the list.',
    },
    'X-Paging-ItemsCount': {
        description: 'The total amount of items in the paginated list.',
    },
};
