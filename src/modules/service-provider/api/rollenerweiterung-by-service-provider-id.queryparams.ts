import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PagedQueryParams } from '../../../shared/paging/index.js';
import { OrganisationID, RolleID } from '../../../shared/types/aggregate-ids.types.js';

export class RollenerweiterungByServiceProvidersIdQueryParams extends PagedQueryParams {
    @IsOptional()
    @IsUUID()
    @ApiProperty({
        description: 'The id of the organisation',
        required: false,
        nullable: true,
    })
    public readonly organisationId?: OrganisationID;

    @IsOptional()
    @IsUUID()
    @ApiProperty({
        description: 'The id of the rolle',
        required: false,
        nullable: true,
    })
    public readonly rolleId?: RolleID;
}
