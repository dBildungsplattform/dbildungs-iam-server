import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class OrganisationByIdParams {
    @IsUUID()
    @ApiProperty({
        description: 'The id of an organization',
        required: true,
        nullable: false,
    })
    public organisationId!: string;

    @ApiProperty({
        description: 'The search filter to find a specific Klasse',
        required: false,
        nullable: true,
    })
    @IsOptional()
    public searchFilter?: string;
}
