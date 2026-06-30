import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsOptional, IsUUID } from 'class-validator';
import { PagedQueryParams } from '../../../shared/paging/index.js';
import { OrganisationID, RolleID } from '../../../shared/types/aggregate-ids.types.js';
import { TransformToArray } from '../../../shared/util/array-transform.validator.js';

export class RollenerweiterungByServiceProvidersIdQueryParams extends PagedQueryParams {
    @IsOptional()
    @IsUUID(undefined, { each: true })
    @TransformToArray()
    @ArrayUnique()
    @ApiProperty({
        description: 'The ids of the organisations where the rollenerweiterung should be available.',
        required: false,
        nullable: true,
        isArray: true,
    })
    public readonly organisationIds?: OrganisationID[];

    @IsOptional()
    @IsUUID(undefined, { each: true })
    @TransformToArray()
    @ArrayUnique()
    @ApiProperty({
        description: 'The ids of the rollen where the rollenerweiterung should be available.',
        required: false,
        nullable: true,
        isArray: true,
    })
    public readonly rolleIds?: RolleID[];
}
