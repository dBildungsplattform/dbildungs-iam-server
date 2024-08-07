import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PagedQueryParams } from '../../../shared/paging/index.js';
export class OrganisationByNameQueryParams extends PagedQueryParams {
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({
        required: false,
        nullable: true,
    })
    public readonly searchFilter?: string;
}
