import { ArrayUnique, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TransformToArray } from '../../../../shared/util/array-transform.validator.js';

export class FindDbiamPersonenkontextWorkflowBodyParams {
    @IsUUID()
    @IsOptional()
    @ApiProperty({
        description: 'ID of the organisation to filter the rollen later',
        required: false,
        nullable: true,
    })
    public readonly organisationId?: string;

    @ArrayUnique()
    @IsUUID(undefined, { each: true })
    @IsOptional()
    @TransformToArray()
    @ApiProperty({
        description: 'IDs of the rollen.',
        required: false,
        nullable: true,
        isArray: true,
    })
    public readonly rollenIds?: string[];

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Rolle name used to filter for rollen in personenkontext.',
        required: false,
        nullable: true,
    })
    public readonly rolleName?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Organisation/SSK name used to filter for schulstrukturknoten in personenkontext.',
        required: false,
        nullable: true,
    })
    public readonly organisationName?: string;

    @IsNotEmpty()
    @IsNumber()
    @IsOptional()
    @ApiProperty({
        description: 'The limit of items for the request.',
        required: false,
        nullable: false,
    })
    public readonly limit?: number;
}
