import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsEnum, IsNotEmpty, MaxLength } from 'class-validator';

import {
    RollenMerkmal,
    RollenMerkmalTypName,
    RollenSystemRecht,
    RollenSystemRechtTypName,
} from '../domain/rolle.enums.js';
import { IsDIN91379AEXT } from '../../../shared/util/din-91379-validation.js';

export class PartialUpdateRolleBodyParams {
    @ApiProperty()
    @IsDIN91379AEXT()
    @IsNotEmpty()
    @MaxLength(200)
    public name!: string;

    @IsEnum(RollenMerkmal, { each: true })
    @ArrayUnique()
    @ApiProperty({ enum: RollenMerkmal, enumName: RollenMerkmalTypName, isArray: true, uniqueItems: true })
    public merkmale!: RollenMerkmal[];

    @IsEnum(RollenSystemRecht, { each: true })
    @ArrayUnique()
    @ApiProperty({ enum: RollenSystemRecht, enumName: RollenSystemRechtTypName, isArray: true, uniqueItems: true })
    public systemrechte!: RollenSystemRecht[];

    @IsEnum(RollenSystemRecht, { each: true })
    @ArrayUnique()
    @ApiProperty({ isArray: true, uniqueItems: true })
    public serviceProviderIds!: string[];
}
