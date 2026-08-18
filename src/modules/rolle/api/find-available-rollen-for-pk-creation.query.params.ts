import { ApiProperty } from '@nestjs/swagger';
import { PagedQueryParams } from '../../../shared/paging/index.js';
import { OrganisationID, RolleID } from '../../../shared/types/aggregate-ids.types.js';
import { RollenArt } from '../domain/rolle.enums.js';
import { RollenSystemRecht } from '../domain/systemrecht.js';
import { IsUUID } from 'class-validator';

export class FindAvailableRollenForPKCreationQueryParams extends PagedQueryParams {
    @ApiProperty({
        description: 'The systemrecht for which the available rollen should be found',
        required: true,
        nullable: false,
    })
    public readonly systemrecht!: RollenSystemRecht;

    @IsUUID()
    @ApiProperty({
        description: 'The organisationId for which the available rollen should be found',
        required: true,
        nullable: false,
    })
    public readonly organisationId!: OrganisationID;

    @ApiProperty({
        description: 'The rollenart of the user for which the available rollen should be found',
        required: false,
        nullable: true,
    })
    public readonly rollenartOfUser?: RollenArt;

    @ApiProperty({
        description: 'The rolleName for which the available rollen should be found',
        required: false,
        nullable: true,
    })
    public readonly rolleName?: string;

    @ApiProperty({
        description: 'The rollenIds for which the available rollen should be found',
        required: false,
        nullable: true,
        type: [String],
    })
    public readonly rollenIds?: Array<RolleID>;
}
