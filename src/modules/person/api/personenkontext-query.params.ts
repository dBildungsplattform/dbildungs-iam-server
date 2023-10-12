import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Personenstatus, Rolle } from '../domain/personenkontext.enums.js';
import { SichtfreigabeType } from './personen-query.param.js';

export class PersonenkontextQueryParams {
    @AutoMap()
    @IsOptional()
    @IsString()
    @Expose({ name: 'referrer' })
    @ApiProperty({
        name: 'referrer',
        required: false,
        nullable: true,
    })
    public readonly referrer?: string;

    @AutoMap()
    @IsOptional()
    @IsEnum(Rolle)
    @Expose({ name: 'rolle' })
    @ApiProperty({
        name: 'rolle',
        required: false,
        nullable: true,
    })
    public readonly rolle?: Rolle;

    @AutoMap()
    @IsOptional()
    @IsEnum(Personenstatus)
    @Expose({ name: 'personenstatus' })
    @ApiProperty({
        name: 'personenstatus',
        required: false,
        nullable: true,
    })
    public readonly personenstatus?: Personenstatus;

    @AutoMap()
    @IsOptional()
    @IsEnum(SichtfreigabeType)
    @Expose({ name: 'sichtfreigabe' })
    @ApiProperty({
        name: 'sichtfreigabe',
        enum: SichtfreigabeType,
        default: SichtfreigabeType.NEIN,
        required: false,
        nullable: true,
    })
    public readonly sichtfreigabe: SichtfreigabeType = SichtfreigabeType.NEIN;
}
