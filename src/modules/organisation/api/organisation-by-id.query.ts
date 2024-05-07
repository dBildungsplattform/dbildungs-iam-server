import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class OrganisationByIdQueryParams {
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({
        required: false,
        nullable: true,
    })
    public readonly searchFilter?: string;
}