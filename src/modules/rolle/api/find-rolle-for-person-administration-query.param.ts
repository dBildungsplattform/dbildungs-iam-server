import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsEnum, IsIn, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

import { TransformToArray } from '../../../shared/util/array-transform.validator.js';
import { RollenSystemRechtEnum, RollenSystemRechtEnumName } from '../domain/systemrecht.js';

export class FindRolleForPersonAdministrationQueryParams {
    @IsOptional()
    @IsString()
    @ApiProperty({
        description: 'The name for the role.',
        required: false,
    })
    public readonly searchStr?: string;

    @IsOptional()
    @IsNumber()
    @ApiProperty({
        description: 'The limit of items for the request.',
        required: false,
    })
    public readonly limit?: number;

    @IsOptional()
    @IsNumber()
    @ApiProperty({
        description: 'The offset of items for the request.',
        required: false,
    })
    public readonly offset?: number;

    @IsOptional()
    @IsArray()
    @IsUUID('all', { each: true })
    @TransformToArray<string>()
    @ApiProperty({
        description: 'OrganisationIds to filter rollen.',
        required: false,
        isArray: true,
    })
    public readonly organisationIds?: string[];

    @IsOptional()
    @TransformToArray()
    @IsEnum(RollenSystemRechtEnum, { each: true })
    @ArrayUnique()
    @ApiProperty({
        enum: RollenSystemRechtEnum,
        nullable: true,
        enumName: RollenSystemRechtEnumName,
        required: false,
        isArray: true,
        description:
            'The system right for which the roles should be available. Can only be PERSONEN_VERWALTEN and optionally MPT_ROLLEN_VERWALTEN.',
    })
    @IsIn([RollenSystemRechtEnum.PERSONEN_VERWALTEN, RollenSystemRechtEnum.MPT_ROLLEN_VERWALTEN], {
        each: true,
    })
    public readonly systemrechte?: RollenSystemRechtEnum[];
}
