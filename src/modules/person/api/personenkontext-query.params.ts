import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Personenstatus, Rolle } from '../domain/personenkontext.enums.js';
import { SichtfreigabeType } from './personen-query.param.js';

export class PersonenkontextQueryParams {
    @AutoMap()
    @IsOptional()
    @IsString()
    @ApiProperty({
        name: 'referrer',
        required: false,
        nullable: true,
    })
    public readonly referrer?: string;

    @AutoMap()
    @IsOptional()
    @IsEnum(Rolle)
    @ApiProperty({
        name: 'rolle',
        required: false,
        nullable: true,
    })
    public readonly rolle?: Rolle;

    @AutoMap()
    @IsOptional()
    @IsEnum(Personenstatus)
    @ApiProperty({
        name: 'personenstatus',
        required: false,
        nullable: true,
    })
    public readonly personenstatus?: Personenstatus;

    @AutoMap()
    @IsOptional()
    @IsEnum(SichtfreigabeType)
    @ApiProperty({
        name: 'sichtfreigabe',
        enum: SichtfreigabeType,
        default: SichtfreigabeType.NEIN,
        required: false,
        nullable: true,
    })
    public readonly sichtfreigabe: SichtfreigabeType = SichtfreigabeType.NEIN;
}
