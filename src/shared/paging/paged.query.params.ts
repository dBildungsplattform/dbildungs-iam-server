import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Min } from 'class-validator';

export abstract class PagedQueryParams {
    @IsOptional()
    @Min(0)
    @ApiPropertyOptional({
        description: 'The offset of the paginated list.',
        required: false,
    })
    public readonly offset?: number;

    @IsOptional()
    @Min(1)
    @ApiPropertyOptional({
        description: 'The requested limit for the page size.',
        required: false,
    })
    public readonly limit?: number;
}
