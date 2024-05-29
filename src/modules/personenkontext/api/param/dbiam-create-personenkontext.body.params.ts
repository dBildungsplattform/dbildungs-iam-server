import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { OrganisationID, PersonID, RolleID } from '../../../../shared/types/index.js';

export class DBiamCreatePersonenkontextBodyParams {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ type: String })
    public readonly personId!: PersonID;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ type: String })
    public readonly organisationId!: OrganisationID;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ type: String })
    public readonly rolleId!: RolleID;
}
