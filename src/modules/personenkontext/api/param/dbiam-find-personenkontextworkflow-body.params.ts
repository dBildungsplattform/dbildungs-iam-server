import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindDbiamPersonenkontextWorkflowBodyParams {
    @IsUUID()
    @IsOptional()
    @ApiProperty({
        description: 'ID of the organisation to filter the rollen later',
        required: false,
        nullable: true,
    })
    public readonly organisationId?: string;

    @IsUUID()
    @IsOptional()
    @ApiProperty({
        description: 'ID of the rolle.',
        required: false,
        nullable: true,
    })
    public readonly rolleId?: string;

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
