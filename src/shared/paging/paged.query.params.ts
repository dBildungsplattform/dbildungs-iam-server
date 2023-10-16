import { AutoMap } from '@automapper/classes';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export abstract class PagedQueryParams {
    @AutoMap()
    @IsOptional()
    @ApiPropertyOptional({
        description: 'The offset of the paginated list.',
        required: false,
    })
    public readonly offset?: number;

    @AutoMap()
    @IsOptional()
    @ApiPropertyOptional({
        description: 'The requested limit for the page size.',
        required: false,
    })
    public readonly limit?: number;
}
