import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

import { TransformToArray } from '../../../shared/util/array-transform.validator.js';

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
}
