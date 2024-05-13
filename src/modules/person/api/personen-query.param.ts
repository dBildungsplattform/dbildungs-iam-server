import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PagedQueryParams } from '../../../shared/paging/index.js';
import { SichtfreigabeType } from '../../personenkontext/domain/personenkontext.enums.js';
import { TransformToArray } from '../../../shared/util/array-transform.validator.js';

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
        required: false,
        nullable: true,
    })
    public readonly familienname?: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    @ApiProperty({
        required: false,
        nullable: true,
    })
    public readonly vorname?: string;

    @AutoMap(() => String)
    @IsOptional()
    @IsEnum(SichtfreigabeType)
    @ApiProperty({
        enum: SichtfreigabeType,
        default: SichtfreigabeType.NEIN,
        required: false,
        nullable: true,
    })
    public readonly sichtfreigabe: SichtfreigabeType = SichtfreigabeType.NEIN;

    @AutoMap()
    @IsOptional()
    @TransformToArray()
    @IsUUID(undefined, { each: true })
    @ArrayUnique()
    @ApiProperty({
        required: false,
        nullable: true,
        isArray: true,
        description: 'Organisation ID used to filter for Persons.',
    })
    public readonly organisationID?: string[];

    @AutoMap()
    @IsOptional()
    @TransformToArray()
    @IsUUID(undefined, { each: true })
    @ArrayUnique()
    @ApiProperty({
        required: false,
        nullable: true,
        isArray: true,
        description: 'Role ID used to filter for Persons.',
    })
    public readonly rolleID?: string[];

    @AutoMap()
    @IsString()
    @IsOptional()
    @ApiProperty({
        description:
            'Search filter used to filter for Persons. It could be the vorname, familienname, referrer or the personalnummer.',
        required: false,
        nullable: true,
    })
    public readonly suchFilter?: string;
}
