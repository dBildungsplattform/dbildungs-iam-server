import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PagedQueryParams } from '../../../../shared/paging/paged.query.params.js';
import {
    Personenstatus,
    PersonenstatusTypName,
    SichtfreigabeType,
    SichtfreigabeTypName,
} from '../../domain/personenkontext.enums.js';

export class PersonenkontextQueryParams extends PagedQueryParams {
    @IsOptional()
    @IsString()
    @ApiProperty({
        required: false,
        nullable: true,
    })
    public readonly personId?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({
        required: false,
        nullable: true,
    })
    public readonly username?: string;

    @IsOptional()
    @IsEnum(Personenstatus)
    @ApiProperty({
        required: false,
        nullable: true,
        enum: Personenstatus,
        enumName: PersonenstatusTypName,
    })
    public readonly personenstatus?: Personenstatus;

    @IsOptional()
    @IsEnum(SichtfreigabeType)
    @ApiProperty({
        enum: SichtfreigabeType,
        enumName: SichtfreigabeTypName,
        default: SichtfreigabeType.NEIN,
        required: false,
        nullable: true,
    })
    public readonly sichtfreigabe: SichtfreigabeType = SichtfreigabeType.NEIN;
}
