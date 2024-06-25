import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

import { OrganisationID, PersonID, RolleID } from '../../../../shared/types/index.js';

export class DbiamPersonenkontextBodyParams {
    @IsString()
    @IsNotEmpty()
    @IsUUID()
    @ApiProperty({ type: String })
    public readonly personId!: PersonID;

    @IsString()
    @IsNotEmpty()
    @IsUUID()
    @ApiProperty({ type: String })
    public readonly organisationId!: OrganisationID;

    @IsString()
    @IsNotEmpty()
    @IsUUID()
    @ApiProperty({ type: String })
    public readonly rolleId!: RolleID;
}
