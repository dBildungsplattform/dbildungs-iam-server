import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { TransformToArray } from '../../../../shared/util/array-transform.validator.js';

export class FindPersonenkontextRollenQueryParams {
    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Rolle name used to filter for rollen in personenkontext.',
        required: false,
        nullable: false,
    })
    public readonly rolleName?: string;

    @IsNotEmpty()
    @IsNumber()
    @IsOptional()
    @ApiProperty({
        description: 'The limit of items for the request.',
        required: false,
        nullable: false,
    })
    public readonly limit?: number;

    @IsArray()
    @IsUUID('all', { each: true })
    @IsOptional()
    @ApiProperty({
        description: 'OrganisationIDs to filter rollen',
        required: false,
        nullable: false,
    })
    @TransformToArray<string>()
    public readonly organisationIds?: string[];
}
