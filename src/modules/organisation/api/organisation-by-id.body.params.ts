import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class OrganisationByIdBodyParams {
    @IsString()
    @ApiProperty({
        description: 'The id of an organization',
        required: true,
        nullable: false,
    })
    public organisationId!: string;
}
