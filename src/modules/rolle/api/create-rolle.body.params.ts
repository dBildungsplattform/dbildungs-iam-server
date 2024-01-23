import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';

import { RollenArt, RollenMerkmal } from '../domain/rolle.enums.js';

export class CreateRolleBodyParams {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    @AutoMap()
    public name!: string;

    @IsUUID()
    @ApiProperty()
    @AutoMap()
    public administeredBySchulstrukturknoten!: string;

    @IsEnum(RollenArt)
    @ApiProperty({ enum: RollenArt })
    @AutoMap(() => String)
    public rollenart!: RollenArt;

    @ArrayUnique()
    @IsEnum(RollenMerkmal, { each: true })
    @ApiProperty({ enum: RollenMerkmal, isArray: true, uniqueItems: true })
    @AutoMap(() => [String])
    public merkmale!: RollenMerkmal[];
}
