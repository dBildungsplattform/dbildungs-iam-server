import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { PagedQueryParams } from '../../../shared/paging/index.js';

export class RollenerweiterungByServiceProvidersIdQueryParams extends PagedQueryParams {
    @IsUUID()
    @ApiProperty({
        description: 'The id of the organisation',
        required: false,
        nullable: true,
    })
    public organisationId?: string;
}
