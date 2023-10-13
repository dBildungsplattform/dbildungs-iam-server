import { ApiPropertyOptional } from '@nestjs/swagger';

export abstract class PagedQueryParams {
    @ApiPropertyOptional({
        description: 'The offset of the paginated list.',
    })
    public readonly offset?: number;

    @ApiPropertyOptional({
        description: 'The requested limit for the page size.',
    })
    public readonly limit?: number;
}


