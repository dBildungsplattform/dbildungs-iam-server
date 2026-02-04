import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PagedQueryParams } from '../../../shared/paging/index.js';

export class RollenerweiterungByServiceProvidersIdQueryParams extends PagedQueryParams {
    @IsOptional()
    @IsUUID()
    @ApiProperty({
        description: 'The id of the organisation',
        required: false,
        nullable: true,
    })
    public readonly organisationId?: string;
}
