import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PagedQueryParams } from '../../../shared/paging/index.js';
import { TransformToArray } from '../../../shared/util/array-transform.validator.js';
import { RollenArt, RollenArtTypName } from '../domain/rolle.enums.js';
import { RollenSystemRechtEnum, RollenSystemRechtEnumName } from '../domain/systemrecht.js';

export class FindRolleQueryParams extends PagedQueryParams {
    @IsOptional()
    @IsString()
    @ApiProperty({
        description: 'The name for the role.',
        required: false,
        nullable: false,
    })
    public readonly searchStr?: string;

    @IsOptional()
    @IsUUID()
    @ApiProperty({
        description: 'The id of the organisation where the role should be available.',
        required: false,
        nullable: false,
    })
    public readonly organisationId?: string;

    @IsOptional()
    @IsEnum(RollenSystemRechtEnum)
    @ApiProperty({
        enum: RollenSystemRechtEnum,
        enumName: RollenSystemRechtEnumName,
        required: false,
        description: 'The system right for which the roles should be available.',
    })
    public readonly systemrecht?: RollenSystemRechtEnum;

    @IsOptional()
    @IsEnum(RollenArt, { each: true })
    @TransformToArray()
    @ArrayUnique()
    @ApiProperty({
        enum: RollenArt,
        enumName: RollenArtTypName,
        isArray: true,
        uniqueItems: true,
        required: false,
        description: 'Filter roles by their role types.',
    })
    public rollenarten?: RollenArt[];
}
