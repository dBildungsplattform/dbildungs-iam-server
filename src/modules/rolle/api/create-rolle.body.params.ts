import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';

import { RollenArt, RollenMerkmal } from '../domain/rolle.enums.js';

export class CreateRolleBodyParams {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    public name!: string;

    @IsUUID()
    @ApiProperty()
    public administeredBySchulstrukturknoten!: string;

    @IsEnum(RollenArt)
    @ApiProperty({ enum: RollenArt })
    public rollenart!: RollenArt;

    @IsEnum(RollenMerkmal, { each: true })
    @ArrayUnique()
    @ApiProperty({ enum: RollenMerkmal, isArray: true, uniqueItems: true })
    public merkmale!: RollenMerkmal[];
}
