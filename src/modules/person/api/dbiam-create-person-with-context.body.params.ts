import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { OrganisationID, RolleID } from '../../../shared/types/aggregate-ids.types.js';
import { IsDIN91379A } from '../../../shared/util/din-91379-validation.js';

export class DbiamCreatePersonWithContextBodyParams {
    @AutoMap()
    @IsDIN91379A()
    @IsNotEmpty()
    @MinLength(2)
    @ApiProperty({ required: true })
    public readonly familienname!: string;

    @AutoMap()
    @IsDIN91379A()
    @IsNotEmpty()
    @MinLength(2)
    @ApiProperty({ required: true })
    public readonly vorname!: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ type: String })
    public readonly organisationId!: OrganisationID;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ type: String })
    public readonly rolleId!: RolleID;
}
