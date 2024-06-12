import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { PersonNameParams } from './person-name.params.js';
import { OrganisationID, RolleID } from '../../../shared/types/aggregate-ids.types.js';

export class DbiamCreatePersonWithContextBodyParams {
    @AutoMap(() => PersonNameParams)
    @ValidateNested()
    @Type(() => PersonNameParams)
    @ApiProperty({ type: PersonNameParams, required: true })
    public readonly name!: PersonNameParams;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ type: String })
    public readonly organisationId!: OrganisationID;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ type: String })
    public readonly rolleId!: RolleID;
}
