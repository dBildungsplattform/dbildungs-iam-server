import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AutoMap } from '@automapper/classes';

export enum VisibilityType {
    JA = 'ja',
    NEIN = 'nein',
}

export class AllPersonsQueryParam {
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
    @Expose({ name: 'familienname' })
    @ApiProperty({
        name: 'familienname',
        required: false,
        nullable: true,
    })
    public readonly familyName?: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    @Expose({ name: 'vorname' })
    @ApiProperty({
        name: 'vorname',
        required: false,
        nullable: true,
    })
    public readonly firstName?: string;

    @AutoMap()
    @IsOptional()
    @IsEnum(VisibilityType)
    @Expose({ name: 'sichtfreigabe' })
    @ApiProperty({
        name: 'sichtfreigabe',
        enum: VisibilityType,
        default: VisibilityType.NEIN,
        required: false,
        nullable: true,
    })
    public readonly visibility: VisibilityType = VisibilityType.NEIN;
}
