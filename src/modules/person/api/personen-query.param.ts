import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AutoMap } from '@automapper/classes';
import { PagedQueryParams } from '../../../shared/paging/index.js';

export enum SichtfreigabeType {
    JA = 'ja',
    NEIN = 'nein',
}

export class PersonenQueryParams extends PagedQueryParams {
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
    @IsString()
    @ApiProperty({
        name: 'familienname',
        required: false,
        nullable: true,
    })
    public readonly familienname?: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    @ApiProperty({
        name: 'vorname',
        required: false,
        nullable: true,
    })
    public readonly vorname?: string;

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
