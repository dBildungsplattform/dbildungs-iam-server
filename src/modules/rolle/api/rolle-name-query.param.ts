import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { PagedQueryParams } from '../../../shared/paging/index.js';

export class RolleNameQueryParams extends PagedQueryParams {
    @IsOptional()
    @IsString()
    @ApiProperty({
        description: 'The name for the role.',
        required: false,
        nullable: false,
    })
    public readonly searchStr?: string;
}
