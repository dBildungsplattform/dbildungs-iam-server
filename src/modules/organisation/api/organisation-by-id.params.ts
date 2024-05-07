import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class OrganisationByIdParams {
    @IsUUID()
    @ApiProperty({
        description: 'The id of an organization',
        required: true,
        nullable: false,
    })
    public organisationId!: string;
}