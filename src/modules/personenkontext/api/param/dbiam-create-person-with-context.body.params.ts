import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { IsDIN91379A } from '../../../../shared/util/din-91379-validation.js';
import { OrganisationID, RolleID } from '../../../../shared/types/aggregate-ids.types.js';

export class DbiamCreatePersonWithContextBodyParams {
    @IsDIN91379A()
    @IsNotEmpty()
    @MinLength(2)
    @ApiProperty({ required: true })
    public readonly familienname!: string;

    @IsDIN91379A()
    @IsNotEmpty()
    @MinLength(2)
    @ApiProperty({ required: true })
    public readonly vorname!: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    public readonly personalnummer?: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ type: String })
    public readonly organisationId!: OrganisationID;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ type: String })
    public readonly rolleId!: RolleID;
}
