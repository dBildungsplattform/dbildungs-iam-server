import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayUnique, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

import { PagedQueryParams } from '../../../shared/paging/index.js';
import { TransformToArray } from '../../../shared/util/array-transform.validator.js';
import { RollenArt, RollenArtTypName } from '../domain/rolle.enums.js';
import { RollenSystemRechtEnum, RollenSystemRechtEnumName } from '../domain/systemrecht.js';
import { IsSystemrechtForRollenAdministration } from './is-systemrecht-for-rollen-admin-validator.js';
import { OrganisationID, RolleID } from '../../../shared/types/index.js';

export class FindRolleQueryParams extends PagedQueryParams {
    @IsOptional()
    @IsString()
    @ApiProperty({
        description: 'The name for the role.',
        required: false,
    })
    public readonly searchStr?: string;

    @IsOptional()
    @IsUUID()
    @ApiProperty({
        description: 'The id of the organisation where the role should be available.',
        required: false,
    })
    public readonly organisationId?: OrganisationID;

    @IsOptional()
    @IsUUID(undefined, { each: true })
    @TransformToArray()
    @ArrayUnique()
    @ApiProperty({
        description: 'The ids of the selected Rollen',
        required: false,
        nullable: true,
        isArray: true,
    })
    public readonly rolleIds?: RolleID[];

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
            'The system rights for which the roles should be available. Can only be ROLLEN_VERWALTEN or ROLLEN_ERWEITERN or both.',
    })
    @IsSystemrechtForRollenAdministration()
    public readonly systemrechte?: RollenSystemRechtEnum[];

    @IsOptional()
    @IsEnum(RollenArt, { each: true })
    @TransformToArray()
    @ArrayUnique()
    @ArrayMaxSize(Object.values(RollenArt).length)
    @ApiProperty({
        enum: RollenArt,
        enumName: RollenArtTypName,
        isArray: true,
        uniqueItems: true,
        required: false,
        maxItems: Object.values(RollenArt).length,
        description: 'Filter roles by their role types.',
    })
    public rollenarten?: RollenArt[];
}
