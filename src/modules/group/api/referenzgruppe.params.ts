import { ApiProperty } from '@nestjs/swagger';
import { Gruppenrollen } from '../domain/gruppe.enums.js';
import { IsEnum, IsString } from 'class-validator';

export class ReferenzgruppeParam {
    @IsString()
    @ApiProperty({ required: true })
    public readonly referenzgruppenId!: string;

    @IsEnum(Gruppenrollen, { each: true })
    @ApiProperty({ required: false })
    public readonly rollen!: Gruppenrollen[];
}
