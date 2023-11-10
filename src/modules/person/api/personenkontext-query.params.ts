import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PagedQueryParams } from '../../../shared/paging/paged.query.params.js';
import { Personenstatus, Rolle, SichtfreigabeType } from '../domain/personenkontext.enums.js';

export class PersonenkontextQueryParams extends PagedQueryParams {
    @AutoMap()
    @IsOptional()
    @IsString()
    @ApiProperty({
        required: false,
        nullable: true,
    })
    public readonly referrer?: string;

    @AutoMap()
    @IsOptional()
    @IsEnum(Rolle)
    @ApiProperty({
        required: false,
        nullable: true,
    })
    public readonly rolle?: Rolle;

    @AutoMap()
    @IsOptional()
    @IsEnum(Personenstatus)
    @ApiProperty({
        required: false,
        nullable: true,
    })
    public readonly personenstatus?: Personenstatus;

    @AutoMap()
    @IsOptional()
    @IsEnum(SichtfreigabeType)
    @ApiProperty({
        enum: SichtfreigabeType,
        default: SichtfreigabeType.NEIN,
        required: false,
        nullable: true,
    })
    public readonly sichtfreigabe: SichtfreigabeType = SichtfreigabeType.NEIN;
}
