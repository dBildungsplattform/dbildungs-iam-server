import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PagedQueryParams } from '../../../../shared/paging/paged.query.params.js';
import {
    Personenstatus,
    PersonenstatusTypName,
    Rolle,
    RolleTypName,
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
    public readonly referrer?: string;

    @IsOptional()
    @IsEnum(Rolle)
    @ApiProperty({
        required: false,
        nullable: true,
        enum: Rolle,
        enumName: RolleTypName,
    })
    public readonly rolle?: Rolle;

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
