import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { AutoMap } from '@automapper/classes';

export enum SichtfreigabeType {
    JA = 'ja',
    NEIN = 'nein',
}

export class PersonenQueryParam {
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

    // this property would be needed for person context.
    /* @AutoMap()
    @IsOptional()
    @IsEnum(SichtfreigabeType)
    @ApiProperty({
        name: 'sichtfreigabe',
        enum: SichtfreigabeType,
        default: SichtfreigabeType.NEIN,
        required: false,
        nullable: true,
    })
    public readonly sichtfreigabe: SichtfreigabeType = SichtfreigabeType.NEIN;*/

    @AutoMap()
    @IsOptional({})
    @ApiProperty({
        default: 0,
        required: false,
        nullable: false,
    })
    public readonly offset: number = 0;

    @AutoMap()
    @IsOptional({})
    @ApiProperty({
        default: 0,
        required: false,
        nullable: false,
    })
    public readonly limit: number = 100;
}
