import { AutoMap } from '@automapper/classes';
import { PagedQueryParams } from '../../../shared/paging/index.js';
import { Transform } from 'class-transformer';
import { ArrayUnique, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrganisationsTyp } from '../domain/organisation.enums.js';
import { RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';

export class FindOrganisationQueryParams extends PagedQueryParams {
    @AutoMap()
    @IsString()
    @IsOptional()
    @ApiProperty({
        required: false,
        nullable: true,
    })
    public readonly kennung?: string;

    @AutoMap()
    @IsString()
    @IsOptional()
    @ApiProperty({
        required: false,
        nullable: true,
    })
    public readonly name?: string;

    @AutoMap()
    @IsString()
    @IsOptional()
    @ApiProperty({
        required: false,
        nullable: true,
    })
    public readonly searchString?: string;

    @AutoMap(() => String)
    @IsEnum(OrganisationsTyp)
    @IsOptional()
    @ApiProperty({
        required: false,
        nullable: true,
        enum: OrganisationsTyp,
        default: OrganisationsTyp.SONSTIGE,
    })
    public readonly typ?: OrganisationsTyp;

    @AutoMap(() => String)
    @IsOptional()
    @Transform(({ value }: { value: string | string[] }) => (Array.isArray(value) ? value : [value]))
    @IsEnum(RollenSystemRecht, { each: true })
    @ArrayUnique()
    @ApiProperty({
        required: false,
        nullable: true,
        enum: RollenSystemRecht,
        enumName: 'RollenSystemRecht',
        isArray: true,
    })
    public readonly systemrechte: RollenSystemRecht[] = [];
}
